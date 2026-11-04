// achievements.js — Steam achievements: per-game detail and a cross-game overview.
//
// Uses three Steam endpoints per game:
//   GetPlayerAchievements             → which achievements this player has, and when
//   GetSchemaForGame                  → display names, descriptions, icons
//   GetGlobalAchievementPercentagesForApp → % of all players who have each one (rarity)
// The schema and global percentages are the same for everyone, so they're cached for a day.

const { SteamError, call, cached, getOwnedGames } = require('./steam');

const PLAYER_TTL = 10 * 60e3;
const GAME_TTL = 24 * 3600e3;

// GetPlayerAchievements reports "game has no achievements" and "profile is private"
// as HTTP errors with a JSON body, so it can't go through call(), which throws on any error.
async function fetchPlayerAchievements(steamid, appid) {
  const url = new URL('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/');
  url.search = new URLSearchParams({
    key: process.env.STEAM_API_KEY,
    steamid,
    appid,
    l: 'english',
  }).toString();

  const res = await fetch(url);
  if (res.status === 429) throw new SteamError('Steam rate limit hit', 429, 'RATE_LIMITED');

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON error page; handled below
  }
  const stats = data?.playerstats;
  if (stats?.success) return stats;

  const message = stats?.error || '';
  if (/no stats/i.test(message)) return null; // game has no achievements
  if (/not public/i.test(message)) {
    throw new SteamError('This profile’s game details are private', 403, 'PRIVATE');
  }
  throw new SteamError(`Steam API ${res.status} on GetPlayerAchievements`, 502);
}

// Display info for every achievement in a game, keyed by its API name.
// If Steam fails here we still return the player's data, just without icons.
function getSchema(appid) {
  return cached(`schema:${appid}`, GAME_TTL, async () => {
    try {
      const data = await call('/ISteamUserStats/GetSchemaForGame/v2/', { appid, l: 'english' });
      const list = data.game?.availableGameStats?.achievements ?? [];
      return Object.fromEntries(list.map((a) => [a.name, a]));
    } catch (err) {
      if (err.code === 'RATE_LIMITED') throw err;
      console.warn(`[achievements] No schema for app ${appid}: ${err.message}`);
      return {};
    }
  });
}

// Percentage of all players who unlocked each achievement, keyed by API name.
function getGlobalPercentages(appid) {
  return cached(`global:${appid}`, GAME_TTL, async () => {
    try {
      const data = await call('/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/', {
        gameid: appid,
      });
      const list = data.achievementpercentages?.achievements ?? [];
      return Object.fromEntries(list.map((a) => [a.name, +Number(a.percent).toFixed(1)]));
    } catch (err) {
      if (err.code === 'RATE_LIMITED') throw err;
      console.warn(`[achievements] No global percentages for app ${appid}: ${err.message}`);
      return {};
    }
  });
}

// Full achievement list for one player in one game.
async function getGameAchievements(steamid, appid) {
  const [player, schema, global] = await Promise.all([
    cached(`ach:${steamid}:${appid}`, PLAYER_TTL, () => fetchPlayerAchievements(steamid, appid)),
    getSchema(appid),
    getGlobalPercentages(appid),
  ]);

  const raw = player?.achievements ?? [];
  const achievements = raw.map((a) => {
    const info = schema[a.apiname] ?? {};
    const unlocked = a.achieved === 1;
    return {
      apiName: a.apiname,
      name: a.name || info.displayName || a.apiname,
      description: a.description || info.description || '',
      hidden: info.hidden === 1,
      unlocked,
      unlockedAt: unlocked && a.unlocktime ? new Date(a.unlocktime * 1000).toISOString() : null,
      globalPercent: global[a.apiname] ?? null,
      // colour icon once unlocked, grey "locked" icon otherwise
      icon: (unlocked ? info.icon : info.icongray) || info.icon || null,
    };
  });

  // Unlocked first (newest first), then locked (easiest first — highest global %)
  achievements.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked) return (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '');
    return (b.globalPercent ?? -1) - (a.globalPercent ?? -1);
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  return {
    appid: Number(appid),
    gameName: player?.gameName ?? null,
    hasAchievements: achievements.length > 0,
    total: achievements.length,
    unlocked: unlockedCount,
    completion: achievements.length ? +(unlockedCount / achievements.length).toFixed(3) : 0,
    achievements,
  };
}

// Runs fn over items with at most `limit` running at once, so we don't fire
// dozens of Steam requests simultaneously.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// One game's achievements, with the game's name/images from the owned-games list.
async function getGameAchievementDetail(steamid, appid) {
  const [owned, detail] = await Promise.all([
    getOwnedGames(steamid),
    getGameAchievements(steamid, appid),
  ]);
  const game = owned.find((g) => g.appid === Number(appid));
  return {
    ...detail,
    name: game?.name ?? detail.gameName ?? null,
    header: game?.header ?? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    icon: game?.icon ?? null,
    minutesTotal: game?.minutesTotal ?? 0,
  };
}

// Achievement summary across the player's `top` most-played games.
async function getAchievementOverview(steamid, { top = 10 } = {}) {
  const owned = await getOwnedGames(steamid);
  const candidates = owned
    .filter((g) => g.minutesTotal > 0)
    .sort((a, b) => b.minutesTotal - a.minutesTotal)
    .slice(0, top);

  const results = await mapLimit(candidates, 5, async (game) => {
    try {
      return { game, detail: await getGameAchievements(steamid, game.appid) };
    } catch (err) {
      if (err.code === 'RATE_LIMITED' || err.code === 'PRIVATE') throw err;
      console.warn(`[achievements] Skipping app ${game.appid}: ${err.message}`);
      return null; // one broken game shouldn't fail the whole overview
    }
  });

  const withAch = results.filter((r) => r && r.detail.hasAchievements);

  const games = withAch.map(({ game, detail }) => {
    const lastUnlockedAt =
      detail.achievements.find((a) => a.unlocked)?.unlockedAt ?? null; // list is newest-first
    return {
      appid: game.appid,
      name: game.name,
      header: game.header,
      icon: game.icon,
      hours: +(game.minutesTotal / 60).toFixed(1),
      unlocked: detail.unlocked,
      total: detail.total,
      completion: detail.completion,
      perfect: detail.unlocked === detail.total,
      lastUnlockedAt,
    };
  });

  // Every unlocked achievement across these games, tagged with its game
  const allUnlocked = withAch.flatMap(({ game, detail }) =>
    detail.achievements
      .filter((a) => a.unlocked)
      .map((a) => ({ ...a, game: { appid: game.appid, name: game.name } }))
  );

  const unlockedTotal = games.reduce((s, g) => s + g.unlocked, 0);
  const achievementTotal = games.reduce((s, g) => s + g.total, 0);

  return {
    steamid,
    gamesChecked: candidates.length,
    totals: {
      gamesWithAchievements: games.length,
      unlocked: unlockedTotal,
      total: achievementTotal,
      averageCompletion: games.length
        ? +(games.reduce((s, g) => s + g.completion, 0) / games.length).toFixed(3)
        : 0,
      perfectGames: games.filter((g) => g.perfect).length,
    },
    games: games.sort((a, b) => b.completion - a.completion),
    rarestUnlocked: allUnlocked
      .filter((a) => a.globalPercent !== null)
      .sort((a, b) => a.globalPercent - b.globalPercent)
      .slice(0, 5),
    recentUnlocks: allUnlocked
      .filter((a) => a.unlockedAt)
      .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
      .slice(0, 10),
  };
}

module.exports = { getGameAchievementDetail, getAchievementOverview };
