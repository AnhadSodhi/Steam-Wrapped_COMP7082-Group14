"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCrown,
  FaFire,
  FaGamepad,
  FaGhost,
  FaRedoAlt,
  FaStar,
  FaSteam,
  FaTimes,
  FaTrophy,
} from "react-icons/fa";
import {
  generateQuestions,
  type Question,
  type SteamStats,
} from "@/lib/quizQuestions";

function getRank(accuracy: number) {
  if (accuracy >= 90)
    return {
      name: "Steam Legend",
      icon: FaCrown,
      description: "You know your gaming history better than anyone.",
    };
  if (accuracy >= 70)
    return {
      name: "Library Master",
      icon: FaTrophy,
      description: "Your Steam library holds very few secrets.",
    };
  if (accuracy >= 40)
    return {
      name: "Casual Explorer",
      icon: FaGamepad,
      description:
        "You've discovered a few surprises about your gaming habits.",
    };
  return {
    name: "Who Owns This Account?",
    icon: FaGhost,
    description: "Your Steam history has some serious plot twists.",
  };
}

export default function SteamQuiz({ steamid }: { steamid: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<SteamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setPoints([]);

    async function loadQuestions() {
      try {
        const response = await fetch(
          `/api/profile/${encodeURIComponent(steamid)}`,
        );
        if (!response.ok) throw new Error("Failed to load profile");
        const data: SteamStats = await response.json();
        setStats(data);
        setQuestions(generateQuestions(data));
      } catch {
        setError("Unable to load your Steam gaming history.");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [steamid]);

  const score = points.filter((p) => p > 0).length;
  const xp = points.reduce((total, p) => total + p, 0);
  let streak = 0;
  let bestStreak = 0;
  for (const p of points) {
    streak = p > 0 ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }

  function handleAnswer(id: string) {
    if (selected !== null || current >= questions.length) return;
    const correct = id === questions[current].correctAnswer;
    setSelected(id);
    setPoints((prev) => [
      ...prev,
      correct ? 100 + Math.min(streak * 25, 100) : 0,
    ]);
  }

  function handleNext() {
    setSelected(null);
    setCurrent((prev) => prev + 1);
  }

  function restartQuiz() {
    if (stats)
      setQuestions(
        generateQuestions(
          stats,
          questions.map((q) => q.id),
        ),
      );
    setCurrent(0);
    setSelected(null);
    setPoints([]);
  }

  if (loading || error || questions.length === 0) {
    const heading = loading
      ? "Loading your quiz"
      : error
        ? "Unable to start your Wrapped"
        : "Not enough gaming data";
    const message = loading
      ? "Analyzing your gaming history..."
      : error ||
        "This profile needs at least four played games to start the quiz.";

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b1220] px-6 text-center text-slate-100">
        <FaSteam className="text-5xl text-sky-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-sm text-slate-400">{message}</p>
        {!loading && (
          <Link
            href={error ? "/" : `/dashboard/${steamid}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            {error ? "Return to search" : "View Wrapped Instead"}
            <FaArrowRight aria-hidden="true" />
          </Link>
        )}
      </main>
    );
  }

  // RESULTS SCREEN
  if (current >= questions.length) {
    const accuracy = Math.round((score / questions.length) * 100);
    const rank = getRank(accuracy);
    const RankIcon = rank.icon;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4 py-10 text-slate-100">
        <section className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#162235] p-6 text-center shadow-2xl sm:p-9">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
            Your Gamer Identity
          </p>
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-sky-500/30 bg-sky-500/10">
            <RankIcon className="text-5xl text-sky-400" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{rank.name}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            {rank.description}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["Correct", `${score}/${questions.length}`],
              ["Total XP", xp],
              ["Best Streak", bestStreak],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-700 bg-[#0f1a2b] px-2 py-4"
              >
                <p className="text-xl font-bold sm:text-2xl">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <p className="mb-6 mt-5 text-sm text-slate-400">
            {accuracy}% quiz accuracy
          </p>

          <Link
            href={`/dashboard/${steamid}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 font-bold text-white transition hover:bg-sky-400"
          >
            Reveal My Steam Wrapped <FaArrowRight aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={restartQuiz}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            <FaRedoAlt aria-hidden="true" /> Try Again
          </button>
        </section>
      </main>
    );
  }

  // ACTIVE QUESTION
  const question = questions[current];
  const answered = selected !== null;
  const isCorrect = selected === question.correctAnswer;
  const hasArtwork = question.options.some((option) => Boolean(option.image));
  const completed = current + Number(answered);

  return (
    <main className="min-h-screen bg-[#0b1220] px-4 py-7 text-slate-100 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <FaArrowLeft className="text-xs" aria-hidden="true" />
            <FaSteam className="text-xl text-sky-400" aria-hidden="true" />
            <span>Steam Wrapped</span>
          </Link>
          <span className="shrink-0 rounded-full bg-[#1d2c45] px-3 py-1.5 text-[11px] font-bold tracking-wide text-sky-300">
            CHALLENGE {current + 1} / {questions.length}
          </span>
        </header>

        <div
          className="mt-6 flex gap-1.5"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={completed}
        >
          {questions.map((item, index) => (
            <div
              key={item.id}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                index < completed ? "bg-sky-400" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-7 text-sm font-semibold">
          <span className="inline-flex items-center gap-2 text-slate-200">
            <FaStar className="text-amber-400" aria-hidden="true" />
            {xp} XP
          </span>
          <span className="inline-flex items-center gap-2 text-slate-200">
            <FaFire className="text-orange-400" aria-hidden="true" />
            {streak} Streak
          </span>
        </div>

        <section className="mx-auto max-w-2xl py-8 text-center sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
            {question.category}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            {question.title}
          </h2>
          <p className="mt-3 text-lg font-medium leading-snug text-slate-200 sm:text-2xl">
            {question.question}
          </p>
          {!answered && (
            <p className="mt-3 text-xs text-slate-400">
              Choose the answer you think is right.
            </p>
          )}
        </section>

        <div
          className={`mx-auto grid grid-cols-2 gap-3 sm:gap-4 ${
            question.options.length === 2 ? "max-w-2xl" : "max-w-3xl"
          }`}
        >
          {question.options.map((option, index) => {
            const correct = option.id === question.correctAnswer;
            const picked = option.id === selected;
            const cardStyle = !answered
              ? "border-slate-700 bg-[#162235] hover:-translate-y-0.5 hover:border-sky-400 hover:bg-[#1c304b]"
              : correct
                ? "border-emerald-400 bg-emerald-950/40"
                : picked
                  ? "border-rose-400 bg-rose-950/40"
                  : "border-slate-800 bg-[#111a2b] opacity-60";

            return (
              <button
                key={option.id}
                type="button"
                disabled={answered}
                aria-pressed={picked}
                onClick={() => handleAnswer(option.id)}
                className={`group overflow-hidden rounded-xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${cardStyle}`}
              >
                {option.image && (
                  <img
                    src={option.image}
                    alt=""
                    loading="lazy"
                    className="aspect-[460/215] w-full object-cover"
                  />
                )}
                <div
                  className={`flex items-center gap-2 p-3 sm:gap-3 sm:px-4 ${
                    hasArtwork ? "min-h-14" : "min-h-24"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                      picked
                        ? "bg-sky-500 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-xs font-semibold leading-snug sm:text-sm">
                    {option.label}
                  </span>
                  {answered &&
                    (correct || picked) &&
                    (correct ? (
                      <FaCheck
                        className="shrink-0 text-emerald-400"
                        aria-label="Correct answer"
                      />
                    ) : (
                      <FaTimes
                        className="shrink-0 text-rose-400"
                        aria-label="Your answer"
                      />
                    ))}
                </div>
              </button>
            );
          })}
        </div>

        {answered && (
          <section
            aria-live="polite"
            className="mx-auto mt-5 flex max-w-3xl flex-col gap-4 rounded-xl border border-slate-700 bg-[#162235] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isCorrect
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {isCorrect ? (
                  <FaCheck aria-hidden="true" />
                ) : (
                  <FaTimes aria-hidden="true" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-bold text-white">
                    {isCorrect ? "You nailed it!" : "Plot twist!"}
                  </h3>
                  {isCorrect && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                      <FaStar aria-hidden="true" /> +{points[current]} XP
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  {question.reveal}
                </p>
                {isCorrect && streak >= 2 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-400">
                    <FaFire aria-hidden="true" /> {streak} answer streak!
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              {current === questions.length - 1
                ? "See My Rank"
                : "Next Challenge"}
              <FaArrowRight aria-hidden="true" />
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
