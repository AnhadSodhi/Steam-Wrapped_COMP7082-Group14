"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Game {
  appid: number;
  name: string;
  minutesTotal: number;
  minutes2Weeks: number;
  lastPlayed: string | null;
  header: string;
}

interface Question {
  id: string;
  category: string;
  title: string;
  question: string;
  options: {
    id: string;
    label: string;
    image?: string;
  }[];
  correctAnswer: string;
  reveal: string;
}

interface SteamStats {
  allPlayed: Game[];
  totals: {
    neverPlayed: number;
  };
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} hours`;
}

function generateQuestions(games: Game[], neverPlayed: number): Question[] {
  const played = [...games]
    .filter((g) => g.minutesTotal > 0)
    .sort((a, b) => b.minutesTotal - a.minutesTotal);

  if (played.length < 4) return [];

  const questions: Question[] = [];

  // Create a question using game artwork
  function addGameQuestion(
    id: string,
    category: string,
    title: string,
    question: string,
    candidates: Game[],
    metric: (game: Game) => number,
    revealValue: (game: Game) => string,
    highest = true,
  ) {
    const sorted = [...candidates].sort((a, b) =>
      highest ? metric(b) - metric(a) : metric(a) - metric(b),
    );

    if (sorted.length < 4) return;

    const answer = sorted[0];

    // Choose games with similar values
    const distractors = sorted
      .slice(1)
      .filter((g) => metric(g) !== metric(answer))
      .sort(
        (a, b) =>
          Math.abs(metric(a) - metric(answer)) -
          Math.abs(metric(b) - metric(answer)),
      )
      .slice(0, 3);

    if (distractors.length < 3) return;

    questions.push({
      id,
      category,
      title,
      question,
      options: shuffle([answer, ...distractors]).map((g) => ({
        id: String(g.appid),
        label: g.name,
        image: g.header,
      })),
      correctAnswer: String(answer.appid),
      reveal: `${answer.name} — ${revealValue(answer)}`,
    });
  }

  // Create a numerical multiple-choice question
  function addNumberQuestion(
    id: string,
    category: string,
    title: string,
    question: string,
    correct: number,
    unit: string,
  ) {
    const spread = Math.max(3, Math.round(correct * 0.25));

    const values = new Set<number>([
      correct,
      Math.max(0, correct - spread),
      correct + spread,
      correct + spread * 2,
    ]);

    let extra = correct + 1;

    while (values.size < 4) {
      values.add(extra++);
    }

    questions.push({
      id,
      category,
      title,
      question,
      options: shuffle([...values]).map((n) => ({
        id: String(n),
        label: `${n.toLocaleString()} ${unit}`,
      })),
      correctAnswer: String(correct),
      reveal: `The actual number is ${correct.toLocaleString()} ${unit}!`,
    });
  }

  // CHALLENGE 1: Most-played game
  addGameQuestion(
    "time-thief",
    "THE BIG REVEAL",
    "The Time Thief",
    "Which game has stolen the most hours of your life?",
    played,
    (g) => g.minutesTotal,
    (g) => `${formatHours(g.minutesTotal)} of lifetime playtime`,
  );

  // CHALLENGE 2: Guess lifetime hours
  const topGame = played[0];

  addNumberQuestion(
    "hour-guess",
    "NUMBER CHALLENGE",
    "The Hour Guess",
    `How many lifetime hours have you spent playing ${topGame.name}?`,
    Math.round(topGame.minutesTotal / 60),
    "hours",
  );

  // CHALLENGE 3: Last-two-weeks obsession
  const recent = played.filter((g) => g.minutes2Weeks > 0);

  addGameQuestion(
    "recent",
    "YOUR CURRENT ERA",
    "Current Obsession",
    "Which game dominated your last two weeks?",
    recent,
    (g) => g.minutes2Weeks,
    (g) => `${formatHours(g.minutes2Weeks)} in the last two weeks`,
  );

  // CHALLENGE 4: Most recently played
  // Uses lastPlayed directly instead of timestamp
  const withDates = played.filter(
    (g) => g.lastPlayed && Number.isFinite(Date.parse(g.lastPlayed)),
  );

  addGameQuestion(
    "last-played",
    "MEMORY CHECK",
    "Last Seen Online",
    "Which game did you play most recently?",
    withDates,
    (g) => Date.parse(g.lastPlayed!),
    (g) => `last played ${new Date(g.lastPlayed!).toLocaleDateString()}`,
  );

  // CHALLENGE 5: Head-to-head
  const first = played[0];

  const second = played
    .slice(1, Math.min(played.length, 12))
    .find((g) => g.minutesTotal !== first.minutesTotal);

  if (second) {
    questions.push({
      id: "versus",
      category: "HEAD TO HEAD",
      title: "The Ultimate Showdown",
      question: "Which of these two games have you played more?",
      options: shuffle([first, second]).map((g) => ({
        id: String(g.appid),
        label: g.name,
        image: g.header,
      })),
      correctAnswer: String(first.appid),
      reveal: `${first.name}: ${formatHours(first.minutesTotal)} vs. ${second.name}: ${formatHours(second.minutesTotal)}`,
    });
  }

  // CHALLENGE 6: Least-played game
  addGameQuestion(
    "forgotten",
    "THE HIDDEN GEM",
    "The Forgotten Favorite",
    "Which of these games has the fewest lifetime hours?",
    played,
    (g) => g.minutesTotal,
    (g) => `${formatHours(g.minutesTotal)} of lifetime playtime`,
    false,
  );

  // CHALLENGE 7: Unplayed games
  addNumberQuestion(
    "backlog",
    "BACKLOG GRAVEYARD",
    "The Backlog Graveyard",
    "How many games in your library have you never played?",
    neverPlayed,
    "games",
  );

  return questions;
}

function getRank(accuracy: number) {
  if (accuracy >= 90) {
    return {
      name: "Steam Legend",
      emoji: "👑",
      description: "You know your gaming history better than anyone.",
    };
  }

  if (accuracy >= 70) {
    return {
      name: "Library Master",
      emoji: "🏆",
      description: "Your Steam library holds very few secrets.",
    };
  }

  if (accuracy >= 40) {
    return {
      name: "Casual Explorer",
      emoji: "🎮",
      description:
        "You've discovered a few surprises about your gaming habits.",
    };
  }

  return {
    name: "Who Owns This Account?",
    emoji: "👻",
    description: "Your Steam history has some serious plot twists.",
  };
}

export default function SteamQuiz({ steamid }: { steamid: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadQuiz() {
      setLoading(true);
      setError("");
      setQuestions([]);
      setCurrent(0);
      setSelected(null);
      setScore(0);
      setXp(0);
      setStreak(0);
      setBestStreak(0);
      setLastPoints(0);

      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(steamid)}`);

        if (!res.ok) {
          throw new Error("Failed to fetch Steam data");
        }

        const data: SteamStats = await res.json();

        const generated = generateQuestions(
          data.allPlayed ?? [],
          data.totals?.neverPlayed ?? 0,
        );

        if (active) {
          setQuestions(generated);
        }
      } catch {
        if (active) {
          setError("Unable to load your Steam gaming history.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      active = false;
    };
  }, [steamid]);

  function handleAnswer(id: string) {
    if (selected !== null || current >= questions.length) {
      return;
    }

    const question = questions[current];

    setSelected(id);

    if (id === question.correctAnswer) {
      const newStreak = streak + 1;
      const bonus = Math.min((newStreak - 1) * 25, 100);
      const earned = 100 + bonus;

      setScore((prev) => prev + 1);
      setXp((prev) => prev + earned);
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
      setLastPoints(earned);
    } else {
      setStreak(0);
      setLastPoints(0);
    }
  }

  function handleNext() {
    setSelected(null);
    setLastPoints(0);
    setCurrent((prev) => prev + 1);
  }

  function restartQuiz() {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setXp(0);
    setStreak(0);
    setBestStreak(0);
    setLastPoints(0);
  }

  // LOADING
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />

        <p className="text-lg text-[var(--text-muted)]">
          Analyzing your gaming history...
        </p>
      </main>
    );
  }

  // ERROR
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">
          Unable to start your Wrapped
        </h1>

        <p className="text-[var(--text-muted)]">{error}</p>

        <Link href="/" className="font-semibold text-blue-400">
          Return to search
        </Link>
      </main>
    );
  }

  // INSUFFICIENT DATA
  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">
          Not enough gaming data
        </h1>

        <p className="text-[var(--text-muted)]">
          This profile needs at least four played games to start the quiz.
        </p>

        <Link
          href={`/dashboard/${steamid}`}
          className="rounded-xl bg-[var(--primary-button)] px-6 py-3 font-semibold text-white"
        >
          View Wrapped Instead →
        </Link>
      </main>
    );
  }

  // FINAL RESULTS
  if (current >= questions.length) {
    const accuracy = Math.round((score / questions.length) * 100);

    const rank = getRank(accuracy);

    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-blue-400">
            YOUR GAMER IDENTITY
          </p>

          <div className="mb-5 text-7xl">{rank.emoji}</div>

          <h1 className="mb-3 text-4xl font-extrabold text-[var(--text-main)]">
            {rank.name}
          </h1>

          <p className="mb-8 text-[var(--text-muted)]">{rank.description}</p>

          <div className="mb-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-2xl font-bold text-white">
                {score}/{questions.length}
              </p>
              <p className="mt-1 text-xs text-slate-300">Correct</p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-2xl font-bold text-blue-400">{xp}</p>
              <p className="mt-1 text-xs text-slate-300">Total XP</p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-2xl font-bold text-orange-400">{bestStreak}</p>
              <p className="mt-1 text-xs text-slate-300">Best Streak</p>
            </div>
          </div>

          <p className="mb-6 text-sm text-[var(--text-muted)]">
            {accuracy}% quiz accuracy
          </p>

          <Link
            href={`/dashboard/${steamid}`}
            className="block rounded-xl bg-[var(--primary-button)] px-8 py-4 font-bold text-white transition hover:bg-[var(--primary-hover)]"
          >
            Reveal My Steam Wrapped →
          </Link>

          <button
            onClick={restartQuiz}
            className="mt-5 font-medium text-blue-400 transition hover:text-blue-300"
          >
            ↻ Try Again
          </button>
        </div>
      </main>
    );
  }

  // ACTIVE QUESTION
  const question = questions[current];

  const answered = selected !== null;
  const isCorrect = selected === question.correctAnswer;

  const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-12 sm:px-8">
      {/* HEADER */}
      <div className="mb-7 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--text-muted)] hover:text-blue-400"
        >
          ← Steam Wrapped
        </Link>

        <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-bold tracking-widest text-blue-400">
          QUIZ MODE
        </span>
      </div>

      {/* SCOREBOARD */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">LEVEL</p>
          <p className="mt-1 text-xl font-bold text-[var(--text-main)]">
            {current + 1}/{questions.length}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">TOTAL XP</p>
          <p className="mt-1 text-xl font-bold text-blue-400">{xp}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">STREAK</p>
          <p className="mt-1 text-xl font-bold text-orange-400">🔥 {streak}</p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-10 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-400 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* QUESTION */}
      <div className="mb-9 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
          {question.category}
        </p>

        <h2 className="mb-4 text-xl font-bold text-blue-400 sm:text-2xl">
          {question.title}
        </h2>

        <h1 className="text-3xl font-extrabold leading-tight text-[var(--text-main)] md:text-5xl">
          {question.question}
        </h1>

        <p className="mt-5 text-sm text-[var(--text-muted)]">
          {answered
            ? "The truth is finally out!"
            : "Think you know your gaming history? Make your guess."}
        </p>
      </div>

      {/* ANSWER CARDS */}
      <div
        className={`grid gap-4 ${
          question.options.length === 2
            ? "mx-auto w-full max-w-3xl grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {question.options.map((option, index) => {
          const correct = option.id === question.correctAnswer;

          const picked = selected === option.id;

          const resultStyle =
            answered && correct
              ? "border-green-500 bg-green-950/40"
              : answered && picked
                ? "border-red-500 bg-red-950/40"
                : "border-[var(--border)] bg-[var(--surface)] hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg";

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              onClick={() => handleAnswer(option.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 ${resultStyle} ${
                answered ? "cursor-default" : "cursor-pointer"
              }`}
            >
              {/* GAME IMAGE */}
              {option.image && (
                <div className="relative overflow-hidden">
                  <img
                    src={option.image}
                    alt={option.label}
                    className="aspect-[460/215] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {answered && correct && (
                    <div className="absolute right-3 top-3 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                      ✓ CORRECT
                    </div>
                  )}

                  {answered && picked && !correct && (
                    <div className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      ✕ YOUR PICK
                    </div>
                  )}
                </div>
              )}

              {/* ANSWER LABEL */}
              <div className="flex min-h-20 items-center gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-sm font-bold text-white">
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="min-w-0 flex-1 text-base font-semibold text-[var(--text-main)] sm:text-lg">
                  {option.label}
                </span>

                {answered && correct && (
                  <span className="text-xl text-green-400">✓</span>
                )}

                {answered && picked && !correct && (
                  <span className="text-xl text-red-400">✕</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ANSWER REVEAL */}
      {answered && (
        <div
          key={question.id}
          aria-live="polite"
          className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-lg"
        >
          <p className="mb-2 text-3xl">{isCorrect ? "🎉" : "👀"}</p>

          <h2
            className={`mb-3 text-2xl font-extrabold ${
              isCorrect ? "text-green-400" : "text-blue-400"
            }`}
          >
            {isCorrect ? "You nailed it!" : "Plot twist!"}
          </h2>

          {isCorrect && (
            <p className="mb-3 text-lg font-bold text-yellow-400">
              +{lastPoints} XP
              {streak >= 2 && ` · 🔥 ${streak} Answer Streak!`}
            </p>
          )}

          <p className="text-lg text-[var(--text-main)]">{question.reveal}</p>

          <button
            onClick={handleNext}
            className="mt-7 w-full rounded-xl bg-[var(--primary-button)] px-8 py-4 font-bold text-white transition hover:bg-[var(--primary-hover)] sm:w-auto"
          >
            {current === questions.length - 1
              ? "Reveal My Gamer Rank →"
              : "Next Challenge →"}
          </button>
        </div>
      )}
    </main>
  );
}
