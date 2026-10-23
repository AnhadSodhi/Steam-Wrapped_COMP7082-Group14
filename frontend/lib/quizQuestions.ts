// Steam Wrapped quiz: randomly choose 3 number + 2 game questions.

export type Game = {
  appid: number;
  name: string;
  minutesTotal: number;
  minutes2Weeks: number;
  lastPlayed: string | null;
  header: string;
};

export type SteamStats = {
  allPlayed: Game[];
  totals: {
    gamesOwned?: number;
    gamesPlayed?: number;
    neverPlayed: number;
    hoursPlayed?: number;
    hoursLast2Weeks?: number;
  };
};

export type Question = {
  id: string;
  category: string;
  title: string;
  question: string;
  options: { id: string; label: string; image?: string }[];
  correctAnswer: string;
  reveal: string;
};

type Data = {
  played: Game[];
  recent: Game[];
  dated: Game[];
  top: Game;
  gamesOwned: number;
  gamesPlayed: number;
  neverPlayed: number;
  hoursPlayed: number;
  hoursLast2Weeks: number;
};

type Basic = Pick<Question, "id" | "category" | "title">;
type NumberItem = Basic & {
  question: string | ((data: Data) => string);
  answer: (data: Data) => number;
  unit: "hours" | "games";
};
type GameItem = Basic & {
  question: string;
  source: "played" | "recent" | "dated";
  metric: (game: Game) => number;
  reveal: (game: Game, others: Game[]) => string;
  lowest?: boolean;
  choices?: 2 | 4;
};

const hours = (game: Game) => `${(game.minutesTotal / 60).toFixed(1)} hours`;
const date = (game: Game) => Date.parse(game.lastPlayed ?? "");

const numberQuestions: NumberItem[] = [
  {
    id: "hour-guess",
    category: "NUMBER CHALLENGE",
    title: "The Hour Guess",
    question: (d) =>
      `How many lifetime hours have you spent playing ${d.top.name}?`,
    answer: (d) => Math.round(d.top.minutesTotal / 60),
    unit: "hours",
  },
  {
    id: "backlog",
    category: "BACKLOG GRAVEYARD",
    title: "The Backlog Graveyard",
    question: "How many games in your library have you never played?",
    answer: (d) => d.neverPlayed,
    unit: "games",
  },
  {
    id: "total-playtime",
    category: "LIFETIME STATS",
    title: "The Big Total",
    question: "How many total hours have you played across your Steam library?",
    answer: (d) => d.hoursPlayed,
    unit: "hours",
  },
  {
    id: "games-owned",
    category: "LIBRARY CHECK",
    title: "The Collector",
    question: "How many games do you own on Steam?",
    answer: (d) => d.gamesOwned,
    unit: "games",
  },
  {
    id: "games-played",
    category: "LIBRARY CHECK",
    title: "The Explorer",
    question: "How many games in your library have you actually played?",
    answer: (d) => d.gamesPlayed,
    unit: "games",
  },
  {
    id: "recent-hours",
    category: "YOUR CURRENT ERA",
    title: "Two-Week Grind",
    question: "How many total hours have you played in the last two weeks?",
    answer: (d) => d.hoursLast2Weeks,
    unit: "hours",
  },
];

const gameQuestions: GameItem[] = [
  {
    id: "time-thief",
    category: "THE BIG REVEAL",
    title: "The Time Thief",
    question: "Which game has stolen the most hours of your life?",
    source: "played",
    metric: (g) => g.minutesTotal,
    reveal: (g) => `${g.name}: ${hours(g)} of lifetime playtime`,
  },
  {
    id: "recent",
    category: "YOUR CURRENT ERA",
    title: "Current Obsession",
    question: "Which game dominated your last two weeks?",
    source: "recent",
    metric: (g) => g.minutes2Weeks,
    reveal: (g) =>
      `${g.name}: ${(g.minutes2Weeks / 60).toFixed(1)} hours in the last two weeks`,
  },
  {
    id: "last-played",
    category: "MEMORY CHECK",
    title: "Last Seen Online",
    question: "Which game did you play most recently?",
    source: "dated",
    metric: date,
    reveal: (g) =>
      `${g.name}: last played ${new Date(g.lastPlayed!).toLocaleDateString()}`,
  },
  {
    id: "versus",
    category: "HEAD TO HEAD",
    title: "The Ultimate Showdown",
    question: "Which of these two games have you played more?",
    source: "played",
    metric: (g) => g.minutesTotal,
    choices: 2,
    reveal: (g, [other]) =>
      `${g.name}: ${hours(g)} vs. ${other.name}: ${hours(other)}`,
  },
  {
    id: "forgotten",
    category: "THE HIDDEN GEM",
    title: "The Forgotten Favorite",
    question: "Which of these games has the fewest lifetime hours?",
    source: "played",
    metric: (g) => g.minutesTotal,
    lowest: true,
    reveal: (g) => `${g.name}: ${hours(g)} of lifetime playtime`,
  },
  {
    id: "oldest-last-played",
    category: "MEMORY CHECK",
    title: "Long Time No See",
    question: "Which of these games has gone the longest without being played?",
    source: "dated",
    metric: date,
    lowest: true,
    reveal: (g) =>
      `${g.name} — last played ${new Date(g.lastPlayed!).toLocaleDateString()}`,
  },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeNumber(item: NumberItem, data: Data): Question {
  const answer = item.answer(data);
  const gap = Math.max(3, Math.round(answer * 0.25));
  const choices = new Set([
    answer,
    Math.max(0, answer - gap),
    answer + gap,
    answer + gap * 2,
  ]);
  for (let n = answer + 1; choices.size < 4; n++) choices.add(n);

  return {
    id: item.id,
    category: item.category,
    title: item.title,
    question:
      typeof item.question === "function" ? item.question(data) : item.question,
    options: shuffle([...choices]).map((n) => ({
      id: String(n),
      label: `${n.toLocaleString()} ${item.unit}`,
    })),
    correctAnswer: String(answer),
    reveal: `The actual number is ${answer.toLocaleString()} ${item.unit}!`,
  };
}

function makeGame(item: GameItem, data: Data): Question | null {
  const candidates = [...data[item.source]].sort((a, b) =>
    item.lowest
      ? item.metric(a) - item.metric(b)
      : item.metric(b) - item.metric(a),
  );
  const winner = candidates[0];
  if (!winner) return null;

  const others = candidates
    .slice(1)
    .filter((g) => item.metric(g) !== item.metric(winner))
    .slice(0, (item.choices ?? 4) - 1);
  if (others.length !== (item.choices ?? 4) - 1) return null;

  return {
    id: item.id,
    category: item.category,
    title: item.title,
    question: item.question,
    options: shuffle([winner, ...others]).map((g) => ({
      id: String(g.appid),
      label: g.name,
      image: g.header,
    })),
    correctAnswer: String(winner.appid),
    reveal: item.reveal(winner, others),
  };
}

function pick(pool: Question[], count: number, previousIds: string[]) {
  const fresh = shuffle(pool.filter((q) => !previousIds.includes(q.id)));
  const old = shuffle(pool.filter((q) => previousIds.includes(q.id)));
  return [...fresh, ...old].slice(0, count);
}

export function generateQuestions(
  stats: SteamStats,
  previousIds: string[] = [],
): Question[] {
  const played = (stats.allPlayed ?? [])
    .filter((g) => g.minutesTotal > 0)
    .sort((a, b) => b.minutesTotal - a.minutesTotal);
  if (played.length < 4) return [];

  const recent = played.filter((g) => g.minutes2Weeks > 0);
  const neverPlayed = stats.totals?.neverPlayed ?? 0;
  const data: Data = {
    played,
    recent,
    top: played[0],
    dated: played.filter((g) => Number.isFinite(date(g))),
    neverPlayed,
    gamesOwned: stats.totals?.gamesOwned ?? played.length + neverPlayed,
    gamesPlayed: stats.totals?.gamesPlayed ?? played.length,
    hoursPlayed:
      stats.totals?.hoursPlayed ??
      Math.round(played.reduce((n, g) => n + g.minutesTotal, 0) / 60),
    hoursLast2Weeks:
      stats.totals?.hoursLast2Weeks ??
      Math.round(recent.reduce((n, g) => n + g.minutes2Weeks, 0) / 60),
  };

  const numbers = numberQuestions.map((q) => makeNumber(q, data));
  const games = gameQuestions
    .map((q) => makeGame(q, data))
    .filter((q): q is Question => q !== null);
  const selected = [
    ...pick(numbers, 3, previousIds),
    ...pick(games, 2, previousIds),
  ];
  if (selected.length < 5) {
    const extra = [...numbers, ...games].filter(
      (q) => !selected.some((s) => s.id === q.id),
    );
    selected.push(...pick(extra, 5 - selected.length, previousIds));
  }
  return shuffle(selected);
}
