"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FaChartBar, FaSteam } from "react-icons/fa";
import SummaryCard from "./SummaryCard";

interface Game {
  appid: number;
  name: string;
  minutesTotal: number;
  minutes2Weeks: number;
  header: string;
}

interface MostPlayedGame extends Game {
  genre: string;
}

interface Profile {
  name: string;
  avatar?: string;
}

interface Totals {
  gamesOwned: number;
  gamesPlayed: number;
  hoursPlayed: number;
  hoursLast2Weeks: number;
}

export default function Dashboard({ steamid }: { steamid: string }) {
  const [games, setGames] = useState<Game[]>([]);
  const [mostPlayedLast2Weeks, setMostPlayedLast2Weeks] =
    useState<MostPlayedGame | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/profile/${steamid}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load games");
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile ?? null);
        setTotals(data.totals ?? null);
        setGames(data.allPlayed ?? []);
        setMostPlayedLast2Weeks(data.mostPlayedLast2Weeks ?? null);
      })
      .catch(() => setError("Unable to load games and stats."))
      .finally(() => setLoading(false));
  }, [steamid]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 text-[var(--text-main)]">
      <div className="mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Steam Wrapped</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Explore your gaming history
            </p>
          </div>

          <a
            href={`https://steamcommunity.com/profiles/${steamid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition hover:shadow-md"
          >
            <FaSteam className="text-lg" />
            Steam Profile ↗
          </a>
        </div>

        {profile && totals && (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowSummary((visible) => !visible)}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary-button)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              <FaChartBar />
              {showSummary ? "Hide Summary Card" : "Generate Summary Card"}
            </button>
          </div>
        )}

        {showSummary && profile && totals && (
          <SummaryCard
            profile={profile}
            totals={totals}
            topGame={
              mostPlayedLast2Weeks
                ? {
                    name: mostPlayedLast2Weeks.name,
                    hoursLast2Weeks: mostPlayedLast2Weeks.minutes2Weeks / 60,
                    hoursTotal: mostPlayedLast2Weeks.minutesTotal / 60,
                    genre: mostPlayedLast2Weeks.genre,
                  }
                : undefined
            }
            topGames={games.slice(0, 5).map((game) => ({
              name: game.name,
              hours: game.minutesTotal / 60,
            }))}
            onClose={() => setShowSummary(false)}
          />
        )}

        <section className="mt-10">
          <h2 className="mb-5 text-xl font-semibold">All Played Games</h2>

          {loading ? (
            <p className="text-[var(--text-muted)]">Loading games...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : games.length === 0 ? (
            <p className="text-[var(--text-muted)]">No games found.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {games.map((game, index) => (
                <div
                  key={game.appid}
                  className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:shadow-lg"
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={game.header}
                      alt={game.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="truncate font-semibold">{game.name}</h3>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-[var(--text-muted)]">
                        Last 2 weeks
                      </span>
                      <span className="font-medium">
                        {(game.minutes2Weeks / 60).toFixed(1)} hrs
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-[var(--text-muted)]">
                        Total playtime
                      </span>
                      <span className="font-medium">
                        {(game.minutesTotal / 60).toFixed(1)} hrs
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
