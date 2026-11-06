// compare.js — compare two players' libraries.
const steam = require("./steam");

const ids = (games) => new Set(games.map((g) => g.appid));
const playedOnly = (games) => games.filter((g) => g.minutesTotal > 0);
const sumMinutes = (games, key) =>
  games.reduce((total, g) => total + g[key], 0);

function jaccard(a, b) {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function compareLibraries(ownedA, ownedB) {
  const byIdB = new Map(ownedB.map((g) => [g.appid, g]));

  const shared = ownedA
    .filter((g) => byIdB.has(g.appid))
    .map((g) => ({
      appid: g.appid,
      name: g.name,
      header: g.header,
      minutesA: g.minutesTotal,
      minutesB: byIdB.get(g.appid).minutesTotal,
    }))
    .sort((x, y) => y.minutesA + y.minutesB - (x.minutesA + x.minutesB));

  const similarity = (a, b) => +jaccard(ids(a), ids(b)).toFixed(3);

  return {
    shared,
    similarity: {
      owned: similarity(ownedA, ownedB),
      played: similarity(playedOnly(ownedA), playedOnly(ownedB)),
    },
  };
}

function summarize({ steamid, name, avatar, profileUrl }, owned) {
  const played = playedOnly(owned);
  const top = played.reduce(
    (best, g) => (!best || g.minutesTotal > best.minutesTotal ? g : best),
    null,
  );

  return {
    profile: { steamid, name, avatar, profileUrl },
    stats: {
      gamesOwned: owned.length,
      gamesPlayed: played.length,
      neverPlayed: owned.length - played.length,
      hoursPlayed: Math.round(sumMinutes(played, "minutesTotal") / 60),
      hoursLast2Weeks: Math.round(sumMinutes(owned, "minutes2Weeks") / 60),
    },
    topGame: top && {
      name: top.name,
      header: top.header,
      hours: +(top.minutesTotal / 60).toFixed(1),
    },
  };
}

async function getComparison(idA, idB) {
  const [profA, profB, ownedA, ownedB] = await Promise.all([
    steam.getPlayerSummary(idA),
    steam.getPlayerSummary(idB),
    steam.getOwnedGames(idA),
    steam.getOwnedGames(idB),
  ]);

  const { shared, similarity } = compareLibraries(ownedA, ownedB);

  return {
    players: [summarize(profA, ownedA), summarize(profB, ownedB)],
    sharedCount: shared.length,
    shared: shared.slice(0, 50),
    similarity,
  };
}

module.exports = { getComparison, compareLibraries, jaccard };
