"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { FaTrophy } from "react-icons/fa";

import type { PanelGame } from "./GamesDetailPanel";
import {
  ProgressBar,
  RarityBadge,
  Section,
  Thumb,
  card,
  muted,
  percent,
  type FetchState,
} from "./PlayedGames";

export interface AchievementGame {
  appid: number;
  name: string;
  header: string;
  unlocked: number;
  total: number;
  perfect: boolean;
  lastUnlockedAt: string | null;
}

export interface Unlock {
  apiName: string;
  name: string;
  icon?: string | null;
  unlockedAt: string | null;
  globalPercent: number | null;
  game: { appid: number; name: string };
}

export interface AchievementOverview {
  gamesChecked: number;
  totals: {
    gamesWithAchievements: number;
    unlocked: number;
    total: number;
    averageCompletion: number;
    perfectGames: number;
  };
  games: AchievementGame[];
  rarestUnlocked: Unlock[];
  recentUnlocks: Unlock[];
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
    : "";

function Stat(props: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className={`p-4 ${card}`}>
      <p className="text-2xl font-bold tabular-nums">{props.value}</p>
      <p className={`mt-1 ${muted}`}>{props.label}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{props.hint}</p>
    </div>
  );
}

function GameProgress(props: { game: AchievementGame; onClick: () => void }) {
  const { game, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full p-3 text-left transition hover:border-blue-400/60 ${card}`}
    >
      <div className="flex items-center gap-3">
        <Thumb
          game={game}
          sizes="112px"
          className="h-20 w-28 shrink-0 rounded-lg"
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold" title={game.name}>
            {game.name}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {game.unlocked} / {game.total} unlocked
          </p>
          <p
            className={`mt-1 text-sm font-bold ${game.perfect ? "text-amber-400" : "text-blue-400"}`}
          >
            {game.perfect ? (
              <>
                <FaTrophy className="mr-1 inline" aria-hidden="true" />
                100% · Perfect
              </>
            ) : (
              `${percent(game.unlocked, game.total)}% complete`
            )}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar
          value={game.unlocked}
          max={game.total}
          label={`${game.name} achievement progress`}
        />
      </div>
      {game.lastUnlockedAt && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Last unlocked {formatDate(game.lastUnlockedAt)}
        </p>
      )}
    </button>
  );
}

function UnlockList(props: {
  title: string;
  subtitle: string;
  items: Unlock[];
  showRarity?: boolean;
  onSelect: (game: Unlock["game"]) => void;
}) {
  const { title, subtitle, items, showRarity, onSelect } = props;
  return (
    <Section title={title} subtitle={subtitle}>
      <ul className={`divide-y divide-[var(--border)] p-2 ${card}`}>
        {items.map((u) => (
          <li key={`${u.game.appid}:${u.apiName}`}>
            <button
              type="button"
              onClick={() => onSelect(u.game)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--background)]"
            >
              {u.icon ? (
                <Image
                  src={u.icon}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 shrink-0 rounded-lg"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <FaTrophy aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={u.name}>
                  {u.name}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {u.game.name}
                </p>
              </div>
              <div className="shrink-0 text-xs text-[var(--text-muted)]">
                {showRarity ? (
                  <RarityBadge pct={u.globalPercent} />
                ) : (
                  formatDate(u.unlockedAt)
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

interface Props {
  state: FetchState<AchievementOverview>;
  onSelectGame: (game: PanelGame) => void;
  onViewAll?: () => void; // only passed by the dashboard preview
}

export default function Achievements({
  state,
  onSelectGame,
  onViewAll,
}: Props) {
  const { data, loading, error } = state;

  if (!data?.games.length) {
    return (
      <div className={onViewAll ? "" : "mt-7 pb-12"}>
        <Section
          title="Achievements"
          subtitle="Your progress across your most-played games"
        >
          <p className={error ? "text-sm text-red-400" : muted}>
            {loading
              ? "Loading achievements..."
              : error
                ? "Achievements are unavailable for this profile."
                : "No public achievement data found for these games."}
          </p>
        </Section>
      </div>
    );
  }

  const { totals, games } = data;
  const openGame = (g: Pick<AchievementGame, "appid" | "name">) =>
    onSelectGame({
      ...g,
      header: games.find((x) => x.appid === g.appid)?.header ?? "",
    });

  const stats = (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat
        label="Achievements unlocked"
        value={`${totals.unlocked.toLocaleString()} / ${totals.total.toLocaleString()}`}
        hint={`${percent(totals.unlocked, totals.total)}% overall`}
      />
      <Stat
        label="Perfect games"
        value={totals.perfectGames}
        hint={`of ${totals.gamesWithAchievements} games with achievements`}
      />
      <Stat
        label="Average completion"
        value={`${Math.round(totals.averageCompletion * 100)}%`}
        hint="across those games"
      />
    </div>
  );

  const gameCards = (list: AchievementGame[]) => (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {list.map((game) => (
        <GameProgress
          key={game.appid}
          game={game}
          onClick={() => openGame(game)}
        />
      ))}
    </div>
  );

  if (onViewAll) {
    // Unfinished games first (the sort is stable, so closest to 100% stays on top).
    const picks = [...games]
      .sort((a, b) => Number(a.perfect) - Number(b.perfect))
      .slice(0, 3);
    return (
      <Section
        title="Achievements"
        subtitle="Closest to 100%, then your perfect games"
        action={{ label: "View all achievements", onClick: onViewAll }}
      >
        <div className="mb-4">{stats}</div>
        {gameCards(picks)}
      </Section>
    );
  }

  return (
    <div className="mt-7 space-y-10 pb-12">
      <Section
        title="Achievements"
        subtitle={`Across your ${data.gamesChecked} most-played games`}
      >
        {stats}
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <UnlockList
          title="Rarest Unlocks"
          subtitle="Hardest achievements you've earned"
          items={data.rarestUnlocked}
          showRarity
          onSelect={openGame}
        />
        <UnlockList
          title="Recent Unlocks"
          subtitle="Your latest achievements"
          items={data.recentUnlocks}
          onSelect={openGame}
        />
      </div>

      <Section
        title="Your Games"
        subtitle="Sorted by completion · click a game for its full list"
      >
        {gameCards(games)}
      </Section>
    </div>
  );
}
