"use client";

import { useEffect, useState } from "react";
import { FaSteam } from "react-icons/fa";

interface Game {
  appid: number;
  name: string;
  minutesTotal: number;
  minutes2Weeks: number;
  header: string;
}

export default function Dashboard({ steamid }: { steamid: string }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/profile/${steamid}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load games");
        return res.json();
      })
      .then((data) => setGames(data.allPlayed ?? []))
      .catch(() => setError("Unable to load games."))
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
              {games.map((game) => (
                <div
                  key={game.appid}
                  className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:shadow-lg"
                >
                  <img
                    src={game.header}
                    alt={game.name}
                    className="aspect-video w-full object-cover"
                  />

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
