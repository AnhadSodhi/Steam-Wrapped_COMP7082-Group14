"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  FaBookmark,
  FaCheckCircle,
  FaClock,
  FaGamepad,
  FaHistory,
  FaSteam,
} from "react-icons/fa";

import SummaryCard from "./SummaryCard";
import GameFilters, {
  defaultGameFilters,
  type GameFilterState,
} from "./GameFilters";
import ProfileHeader from "./ProfileHeader";

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
  neverPlayed?: number;
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
  const [filters, setFilters] = useState<GameFilterState>({
    ...defaultGameFilters,
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    setShowSummary(false);
    setFilters({ ...defaultGameFilters });

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

  const filteredGames = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    const result = games.filter((game) => {
      if (search && !game.name.toLowerCase().includes(search)) return false;
      if (filters.category === "recent" && game.minutes2Weeks <= 0)
        return false;
      if (filters.category === "light" && game.minutesTotal >= 600)
        return false;
      if (filters.category === "marathon" && game.minutesTotal < 6000)
        return false;
      return true;
    });

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "most":
          return b.minutesTotal - a.minutesTotal;
        case "least":
          return a.minutesTotal - b.minutesTotal;
        case "recent":
          return (
            b.minutes2Weeks - a.minutes2Weeks || b.minutesTotal - a.minutesTotal
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [games, filters]);

  const stats = totals
    ? [
        {
          label: "Games Owned",
          value: totals.gamesOwned.toLocaleString(),
          Icon: FaGamepad,
        },
        {
          label: "Games Played",
          value: totals.gamesPlayed.toLocaleString(),
          Icon: FaCheckCircle,
        },
        {
          label: "Never Played",
          value: (
            totals.neverPlayed ??
            Math.max(0, totals.gamesOwned - totals.gamesPlayed)
          ).toLocaleString(),
          Icon: FaBookmark,
        },
        {
          label: "Total Playtime",
          value: `${totals.hoursPlayed.toLocaleString()}h`,
          Icon: FaClock,
        },
        {
          label: "Last 2 Weeks",
          value: `${totals.hoursLast2Weeks.toLocaleString()}h`,
          Icon: FaHistory,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-main)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Steam Wrapped
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            A closer look at your gaming history
          </p>
        </div>

        <ProfileHeader
          steamid={steamid}
          profile={profile}
          showSummary={showSummary}
          canShowSummary={Boolean(profile && totals)}
          onToggleSummary={() => setShowSummary(!showSummary)}
        />

        {!loading && !error && totals && (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {stats.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Icon aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>
        )}
        {showSummary && profile && totals && (
          <div className="mt-6">
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
          </div>
        )}

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-xl font-bold sm:text-2xl">All Played Games</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Search, sort, and explore your collection
            </p>
          </div>

          {!loading && !error && games.length > 0 && (
            <div className="mb-5">
              <GameFilters
                filters={filters}
                onChange={setFilters}
                resultCount={filteredGames.length}
                totalCount={games.length}
              />
            </div>
          )}

          {loading ? (
            <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-[var(--text-muted)]">
              Loading games...
            </p>
          ) : error ? (
            <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-red-400">
              {error}
            </p>
          ) : games.length === 0 ? (
            <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-[var(--text-muted)]">
              No games found.
            </p>
          ) : filteredGames.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <p className="font-semibold">No matching games</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Try another filter or search term.
              </p>
              <button
                type="button"
                onClick={() => setFilters({ ...defaultGameFilters })}
                className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGames.map((game, index) => (
                <div
                  key={game.appid}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition duration-200 hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-xl"
                >
                  <div className="relative aspect-[460/215] w-full overflow-hidden bg-[var(--background)]">
                    {game.header ? (
                      <Image
                        src={game.header}
                        alt={game.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.04]"
                        loading={index < 2 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-[var(--text-muted)]">
                        <FaSteam aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="truncate text-base font-semibold"
                      title={game.name}
                    >
                      {game.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 text-[var(--text-muted)]">
                        <FaClock className="text-blue-400" aria-hidden="true" />
                        <strong className="font-semibold text-[var(--text-main)]">
                          {(game.minutesTotal / 60).toFixed(1)}h
                        </strong>
                        total
                      </span>
                      {game.minutes2Weeks > 0 ? (
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                          {(game.minutes2Weeks / 60).toFixed(1)}h recently
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">
                          Not played recently
                        </span>
                      )}
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
