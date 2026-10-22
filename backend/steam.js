// steam.js — Steam Web API service layer
// Requires Node 18+ (global fetch). Set STEAM_API_KEY in Railway → Variables.

const BASE = 'https://api.steampowered.com';
const KEY = process.env.STEAM_API_KEY;
if (!KEY) console.warn('[steam] STEAM_API_KEY is not set');

class SteamError extends Error {
  constructor(message, status = 500, code = 'STEAM_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// --- tiny in-memory cache (keeps you well under the ~100k calls/day limit,
// and makes shared links load fast). Swap for Redis later if you scale out.
const cache = new Map();
async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fn();
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

async function call(path, params = {}) {
  const url = new URL(BASE + path);
  url.search = new URLSearchParams({ key: KEY, format: 'json', ...params }).toString();
  const res = await fetch(url);
  if (res.status === 429) throw new SteamError('Steam rate limit hit', 429, 'RATE_LIMITED');
  if (!res.ok) throw new SteamError(`Steam API ${res.status} on ${path}`, 502);
  return res.json();
}

// Accepts a SteamID64, a vanity name, or a full profile URL:
//   76561197960287930 | gabelogannewell | https://steamcommunity.com/id/gabelogannewell/
async function resolveSteamId(input) {
  const q = String(input || '').trim();
  if (!q) throw new SteamError('Empty search', 400, 'BAD_INPUT');

  const m = q.match(/steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i);
  if (m && m[1].toLowerCase() === 'profiles') return m[2];
  if (!m && /^\d{17}$/.test(q)) return q;

  const vanity = m ? m[2] : q;
  return cached(`vanity:${vanity.toLowerCase()}`, 24 * 3600e3, async () => {
    const data = await call('/ISteamUser/ResolveVanityURL/v1/', { vanityurl: vanity });
    if (data.response?.success !== 1) {
      throw new SteamError(`No Steam profile found for "${vanity}"`, 404, 'NOT_FOUND');
    }
    return data.response.steamid;
  });
}

async function getPlayerSummary(steamid) {
  return cached(`summary:${steamid}`, 10 * 60e3, async () => {
    const data = await call('/ISteamUser/GetPlayerSummaries/v2/', { steamids: steamid });
    const p = data.response?.players?.[0];
    if (!p) throw new SteamError('Profile not found', 404, 'NOT_FOUND');
    return {
      steamid: p.steamid,
      name: p.personaname,
      avatar: p.avatarfull,
      profileUrl: p.profileurl,
      isPublic: p.communityvisibilitystate === 3,
      countryCode: p.loccountrycode ?? null,
      createdAt: p.timecreated ? new Date(p.timecreated * 1000).toISOString() : null,
    };
  });
}

const headerImage = (appid) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
const iconImage = (appid, hash) =>
  hash ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg` : null;

async function getOwnedGames(steamid) {
  return cached(`owned:${steamid}`, 10 * 60e3, async () => {
    const data = await call('/IPlayerService/GetOwnedGames/v1/', {
      steamid,
      include_appinfo: 1,
      include_played_free_games: 1,
    });
    // `games` is missing entirely when the user's "Game details" privacy is not public
    if (!data.response?.games) {
      throw new SteamError('This profile’s game details are private', 403, 'PRIVATE');
    }
    return data.response.games.map((g) => ({
      appid: g.appid,
      name: g.name,
      minutesTotal: g.playtime_forever ?? 0,
      minutes2Weeks: g.playtime_2weeks ?? 0,
      lastPlayed: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : null,
      icon: iconImage(g.appid, g.img_icon_url),
      header: headerImage(g.appid),
    }));
  });
}

async function getGameGenre(appid) {
  return cached(`genre:${appid}`, 24 * 3600e3, async () => {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
    if (!res.ok) throw new SteamError(`Steam store API ${res.status}`, 502);

    const data = await res.json();
    const genres = data?.[appid]?.data?.genres;
    return Array.isArray(genres) && genres.length > 0
      ? genres.map((genre) => genre.description).join(', ')
      : 'Unknown genre';
  });
}

// Builds the stats payload the frontend / card generator consumes.
// from/to (ISO dates, optional) filter by *last played* date — see note in README section of chat.
async function getProfileStats(steamid, { from, to, top = 10 } = {}) {
  const [profile, owned] = await Promise.all([getPlayerSummary(steamid), getOwnedGames(steamid)]);

  const fromT = from ? Date.parse(from) : -Infinity;
  const toT = to ? Date.parse(to) : Infinity;

  const played = owned
    .filter((g) => g.minutesTotal > 0)
    .filter((g) => {
      if (!from && !to) return true;
      const t = g.lastPlayed ? Date.parse(g.lastPlayed) : NaN;
      return t >= fromT && t <= toT;
    })
    .sort((a, b) => b.minutesTotal - a.minutesTotal);

  const totalMinutes = played.reduce((s, g) => s + g.minutesTotal, 0);
  const recent = owned
    .filter((g) => g.minutes2Weeks > 0)
    .sort((a, b) => b.minutes2Weeks - a.minutes2Weeks);
  let genre = 'Genre unavailable';
  if (recent[0]) {
    try {
      genre = await getGameGenre(recent[0].appid);
    } catch (err) {
      console.warn(`[steam] Unable to load genre for app ${recent[0].appid}`, err);
    }
  }
  const mostPlayedLast2Weeks = recent[0]
    ? {
        ...recent[0],
        genre,
      }
    : null;

  return {
    profile,
    range: { from: from ?? null, to: to ?? null },
    totals: {
      gamesOwned: owned.length,
      gamesPlayed: played.length,
      neverPlayed: owned.filter((g) => g.minutesTotal === 0).length,
      hoursPlayed: Math.round(totalMinutes / 60),
      hoursLast2Weeks: Math.round(recent.reduce((s, g) => s + g.minutes2Weeks, 0) / 60),
    },
    topGames: played.slice(0, top).map((g) => ({
      ...g,
      hours: +(g.minutesTotal / 60).toFixed(1),
      share: totalMinutes ? +(g.minutesTotal / totalMinutes).toFixed(3) : 0,
    })),
    recentGames: recent.slice(0, top),
    mostPlayedLast2Weeks,
    allPlayed: played,
  };
}

module.exports = { SteamError, resolveSteamId, getPlayerSummary, getOwnedGames, getProfileStats };
