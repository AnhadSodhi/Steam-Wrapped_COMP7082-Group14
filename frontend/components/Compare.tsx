"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { FaArrowLeft, FaSteam, FaUserFriends } from "react-icons/fa";

type Player = {
  profile: {
    steamid: string;
    name: string;
    avatar: string;
    profileUrl: string;
  };
  stats: {
    gamesOwned: number;
    gamesPlayed: number;
    neverPlayed: number;
    hoursPlayed: number;
    hoursLast2Weeks: number;
  };
  topGame: { name: string; header: string; hours: number } | null;
};

type SharedGame = {
  appid: number;
  name: string;
  header: string;
  minutesA: number;
  minutesB: number;
};

type Comparison = {
  players: [Player, Player];
  sharedCount: number;
  shared: SharedGame[];
  similarity: { owned: number; played: number };
};

const ROWS: {
  label: string;
  key: keyof Player["stats"];
  lowerWins?: boolean;
}[] = [
  { label: "Games owned", key: "gamesOwned" },
  { label: "Games played", key: "gamesPlayed" },
  { label: "Never played", key: "neverPlayed", lowerWins: true },
  { label: "Total hours", key: "hoursPlayed" },
  { label: "Hours (last 2 weeks)", key: "hoursLast2Weeks" },
];

const VERDICTS: [number, string][] = [
  [0.5, "Gaming twins"],
  [0.25, "Plenty in common"],
  [0.1, "Some overlap"],
];

const box = "rounded-2xl border border-slate-700 bg-[#162235]";
const pct = (n: number) => `${Math.round(n * 100)}%`;
const hrs = (minutes: number) => `${(minutes / 60).toFixed(1)}h`;
const verdict = (score: number) =>
  VERDICTS.find(([min]) => score >= min)?.[1] ??
  "Completely different libraries";
const wins = (mine: number, other: number, lowerWins = false) =>
  lowerWins ? mine < other : mine > other;

function Thumb({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-12 w-24 shrink-0 rounded-lg object-cover"
    />
  );
}

export default function Compare({ steamid }: { steamid: string }) {
  const [friend, setFriend] = useState("");
  const [data, setData] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const other = friend.trim();
    if (!other) return;

    setLoading(true);
    setError("");
    setData(null);
    try {
      const query = new URLSearchParams({ a: steamid, b: other });
      const res = await fetch(`/api/compare?${query}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Comparison failed");
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1220] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/dashboard/${steamid}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          <FaArrowLeft className="text-xs" aria-hidden="true" />
          <FaSteam className="text-xl text-sky-400" aria-hidden="true" />
          <span>Back to Steam Wrapped</span>
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold">Compare with a friend</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter a SteamID64, a vanity name or a profile URL.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={friend}
            onChange={(e) => setFriend(e.target.value)}
            placeholder="e.g. gabelogannewell"
            aria-label="Friend's Steam ID, vanity name or profile URL"
            className="flex-1 rounded-xl border border-slate-700 bg-[#162235] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !friend.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            <FaUserFriends aria-hidden="true" />
            {loading ? "Comparing..." : "Compare"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
        {data && <Results data={data} />}
      </div>
    </main>
  );
}

function Results({ data }: { data: Comparison }) {
  const [a, b] = data.players;
  const { owned, played } = data.similarity;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${box} p-5 text-center`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
            Library similarity
          </p>
          <p className="mt-2 text-5xl font-extrabold">{pct(owned)}</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {verdict(owned)}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Jaccard similarity: games you both own ÷ games either of you owns (
            {data.sharedCount} shared). Only games you have both played:{" "}
            {pct(played)}.
          </p>
        </section>

        <section className={`${box} p-5 lg:col-span-2`}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {[a, b].map(({ profile }) => (
              <a
                key={profile.steamid}
                href={profile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 flex-col items-center gap-1 hover:text-sky-300"
              >
                <img
                  src={profile.avatar}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-slate-600"
                />
                <span className="max-w-full truncate text-sm font-bold">
                  {profile.name}
                </span>
              </a>
            ))}
            <span className="col-start-2 row-start-1 text-xs font-bold text-slate-500">
              VS
            </span>
          </div>

          <dl className="mt-3 divide-y divide-slate-700">
            {ROWS.map(({ label, key, lowerWins }) => {
              const cell = (mine: number, other: number, align: string) => (
                <dd
                  className={`${align} text-lg font-bold tabular-nums ${
                    wins(mine, other, lowerWins) ? "text-emerald-400" : ""
                  }`}
                >
                  {mine.toLocaleString()}
                </dd>
              );
              return (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2"
                >
                  {cell(a.stats[key], b.stats[key], "text-right")}
                  <dt className="w-32 text-center text-xs text-slate-400 sm:w-44">
                    {label}
                  </dt>
                  {cell(b.stats[key], a.stats[key], "text-left")}
                </div>
              );
            })}
          </dl>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {[a, b].map(({ profile, topGame }) => (
              <div
                key={profile.steamid}
                className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#0f1a2b] p-2"
              >
                {topGame ? (
                  <>
                    <Thumb src={topGame.header} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                        Most played
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {topGame.name}
                      </p>
                      <p className="text-xs text-slate-400">{topGame.hours}h</p>
                    </div>
                  </>
                ) : (
                  <p className="p-1 text-xs text-slate-400">No games played</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-xl font-bold">
          Games you both own ({data.sharedCount})
        </h2>
        {data.shared.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No games in common.</p>
        ) : (
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.shared.map((g) => (
              <li
                key={g.appid}
                className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#162235] p-2"
              >
                <Thumb src={g.header} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" title={g.name}>
                    {g.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {a.profile.name}: {hrs(g.minutesA)} · {b.profile.name}:{" "}
                    {hrs(g.minutesB)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {data.sharedCount > data.shared.length && (
          <p className="mt-3 text-xs text-slate-500">
            Showing the {data.shared.length} most-played shared games.
          </p>
        )}
      </section>
    </div>
  );
}
