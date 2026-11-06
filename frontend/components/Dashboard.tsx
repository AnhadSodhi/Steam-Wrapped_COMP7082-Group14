"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBookmark,
  FaCheckCircle,
  FaClock,
  FaGamepad,
  FaHistory,
  FaUserFriends,
} from "react-icons/fa";

import SummaryCard from "./SummaryCard";
import GameDetailsPanel, { type PanelGame } from "./GamesDetailPanel";
import Achievements, { type AchievementOverview } from "./Achievements";
import type { GameFilterState } from "./GameFilters";
import ProfileHeader from "./ProfileHeader";
import PlayedGames, {
  GameCard,
  Section,
  Thumb,
  card,
  categoryRules,
  hours,
  muted,
  sorters,
  useFetch,
  type FetchState,
  type Game,
} from "./PlayedGames";
import Link from "next/link";

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

interface ProfileData {
  profile?: Profile;
  totals?: Totals;
  allPlayed?: Game[];
  mostPlayedLast2Weeks?: (Game & { genre: string }) | null;
}

type View = "overview" | "library" | "achievements";

interface OverviewProps {
  games: Game[];
  topPlayed: Game[];
  achievements: FetchState<AchievementOverview>;
  onOpenLibrary: (category?: GameFilterState["category"]) => void;
  onOpenAchievements: () => void;
  onSelectGame: (game: PanelGame) => void;
}

function Overview(props: OverviewProps) {
  const { games, topPlayed, achievements, onOpenLibrary, onSelectGame } = props;
  const recentlyActive = useMemo(
    () => games.filter(categoryRules.recent).sort(sorters.recent).slice(0, 3),
    [games],
  );

  return (
    <div className="mt-7 space-y-10 pb-10">
      <Section
        title="Top Played"
        subtitle="Your six most-played games"
        action={{
          label: "View all played games",
          onClick: () => onOpenLibrary(),
        }}
      >
        {topPlayed.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {topPlayed.map((game) => (
              <GameCard
                key={game.appid}
                game={game}
                onClick={() => onSelectGame(game)}
              />
            ))}
          </div>
        ) : (
          <p className={muted}>No played games found.</p>
        )}
      </Section>

      <Achievements
        state={achievements}
        onSelectGame={onSelectGame}
        onViewAll={props.onOpenAchievements}
      />

      <Section
        title="Recently Active"
        subtitle="Games played in the last two weeks"
        action={{
          label: "View recent games",
          onClick: () => onOpenLibrary("recent"),
        }}
      >
        {recentlyActive.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {recentlyActive.map((game) => (
              <button
                type="button"
                key={game.appid}
                onClick={() => onSelectGame(game)}
                className={`group flex min-w-0 items-center gap-3 overflow-hidden p-3 text-left transition hover:border-blue-400/50 ${card}`}
              >
                <Thumb
                  game={game}
                  sizes="96px"
                  className="h-16 w-24 shrink-0 rounded-lg"
                />
                <div className="min-w-0">
                  <h3
                    className="truncate text-sm font-semibold"
                    title={game.name}
                  >
                    {game.name}
                  </h3>
                  <p className="mt-1 text-xs text-blue-400">
                    {hours(game.minutes2Weeks)}h recently
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className={muted}>No games played in the last two weeks.</p>
        )}
      </Section>
    </div>
  );
}

const n = (value: number) => value.toLocaleString();

export default function Dashboard({ steamid }: { steamid: string }) {
  const { data, loading, error } = useFetch<ProfileData>(
    `/api/profile/${steamid}`,
  );
  const achievements = useFetch<AchievementOverview>(
    `/api/achievements/${steamid}?top=10`,
  );
  const summaryAchievements = useFetch<AchievementOverview>(
    `/api/achievements/${steamid}`,
  );

  const [view, setView] = useState<View>("overview");
  const [showSummary, setShowSummary] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PanelGame | null>(null);
  const [library, setLibrary] = useState<{
    key: number;
    category?: GameFilterState["category"];
  }>({ key: 0 });

  useEffect(() => {
    setView("overview");
    setShowSummary(false);
    setSelectedGame(null);
  }, [steamid]);

  const profile = data?.profile ?? null;
  const totals = data?.totals ?? null;
  const mostPlayed = data?.mostPlayedLast2Weeks;
  const games = useMemo(() => data?.allPlayed ?? [], [data]);
  const topPlayed = useMemo(
    () => [...games].sort(sorters.most).slice(0, 6),
    [games],
  );

  const neverPlayed = totals
    ? (totals.neverPlayed ??
      Math.max(0, totals.gamesOwned - totals.gamesPlayed))
    : 0;

  const stats = totals
    ? [
        { label: "Games Owned", value: n(totals.gamesOwned), Icon: FaGamepad },
        {
          label: "Games Played",
          value: n(totals.gamesPlayed),
          Icon: FaCheckCircle,
        },
        { label: "Never Played", value: n(neverPlayed), Icon: FaBookmark },
        {
          label: "Total Playtime",
          value: `${n(totals.hoursPlayed)}h`,
          Icon: FaClock,
        },
        {
          label: "Last 2 Weeks",
          value: `${n(totals.hoursLast2Weeks)}h`,
          Icon: FaHistory,
        },
      ]
    : [];

  const closeGame = useCallback(() => setSelectedGame(null), []);

  const openGame = (game: PanelGame) =>
    setSelectedGame(games.find((g) => g.appid === game.appid) ?? game);

  function openLibrary(category?: GameFilterState["category"]) {
    setLibrary((prev) => ({ key: prev.key + 1, category }));
    setView("library");
  }

  const tabs: [View, string][] = [
    ["overview", "Overview"],
    ["library", `Played Games${games.length ? ` (${games.length})` : ""}`],
    ["achievements", "Achievements"],
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-main)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Steam Wrapped
          </h1>
          <p className={`mt-1 ${muted}`}>
            A closer look at your gaming history
          </p>
        </header>

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
              <div key={label} className={`p-4 ${card}`}>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Icon aria-hidden="true" />
                </div>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className={`mt-1 ${muted}`}>{label}</p>
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
                mostPlayed
                  ? {
                      name: mostPlayed.name,
                      hoursLast2Weeks: mostPlayed.minutes2Weeks / 60,
                      hoursTotal: mostPlayed.minutesTotal / 60,
                      genre: mostPlayed.genre,
                    }
                  : undefined
              }
              topGames={topPlayed
                .slice(0, 5)
                .map((g) => ({ name: g.name, hours: g.minutesTotal / 60 }))}
              achievements={summaryAchievements.data ?? undefined}
              onClose={() => setShowSummary(false)}
            />
          </div>
        )}

        <nav
          className="mt-8 flex gap-2 border-b border-[var(--border)] pb-3"
          aria-label="Dashboard sections"
        >
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => (id === "library" ? openLibrary() : setView(id))}
              aria-current={view === id ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                view === id
                  ? "bg-blue-500 text-white"
                  : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {label}
            </button>
          ))}
          <Link
            href={`/compare/${steamid}`}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-blue-400/60 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500 hover:text-white"
          >
            <FaUserFriends aria-hidden="true" />
            <span className="hidden sm:inline">Compare with a friend</span>
            <span className="sm:hidden">Compare</span>
          </Link>
        </nav>

        {loading || error ? (
          <p
            className={`mt-6 p-8 ${card} ${error ? "text-red-400" : "text-[var(--text-muted)]"}`}
          >
            {error ? "Unable to load games and stats." : "Loading games..."}
          </p>
        ) : view === "overview" ? (
          <Overview
            games={games}
            topPlayed={topPlayed}
            achievements={achievements}
            onOpenLibrary={openLibrary}
            onOpenAchievements={() => setView("achievements")}
            onSelectGame={openGame}
          />
        ) : view === "library" ? (
          <PlayedGames
            key={library.key}
            games={games}
            initialCategory={library.category}
            onSelectGame={openGame}
          />
        ) : (
          <Achievements state={achievements} onSelectGame={openGame} />
        )}

        {selectedGame && (
          <GameDetailsPanel
            key={selectedGame.appid}
            steamid={steamid}
            game={selectedGame}
            onClose={closeGame}
          />
        )}
      </div>
    </main>
  );
}
