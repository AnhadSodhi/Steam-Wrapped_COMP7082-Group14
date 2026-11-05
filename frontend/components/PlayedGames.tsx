"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { FaClock, FaSteam } from "react-icons/fa";

import GameFilters, {
  defaultGameFilters,
  type GameFilterState,
} from "./GameFilters";

export interface Game {
  appid: number;
  name: string;
  minutesTotal: number;
  minutes2Weeks: number;
  header: string;
}

export const card =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)]";
export const link = "text-sm font-semibold text-blue-400 hover:text-blue-300";
export const muted = "text-sm text-[var(--text-muted)]";
export const hours = (minutes: number) => (minutes / 60).toFixed(1);
export const percent = (value: number, max: number) =>
  max ? Math.round((value / max) * 100) : 0;

export const categoryRules: Record<string, (g: Game) => boolean> = {
  recent: (g) => g.minutes2Weeks > 0,
  light: (g) => g.minutesTotal < 600,
  marathon: (g) => g.minutesTotal >= 6000,
};

export const sorters: Record<string, (a: Game, b: Game) => number> = {
  most: (a, b) => b.minutesTotal - a.minutesTotal,
  least: (a, b) => a.minutesTotal - b.minutesTotal,
  recent: (a, b) =>
    b.minutes2Weeks - a.minutes2Weeks || b.minutesTotal - a.minutesTotal,
  name: (a, b) => a.name.localeCompare(b.name),
};

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: false });

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => setState({ data, loading: false, error: false }))
      .catch((err) => {
        if (err.name !== "AbortError")
          setState({ data: null, loading: false, error: true });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

export function Thumb(props: {
  game: Pick<Game, "name" | "header">;
  sizes: string;
  className: string;
}) {
  const { game, sizes, className } = props;
  return (
    <div
      className={`relative overflow-hidden bg-[var(--background)] ${className}`}
    >
      {game.header ? (
        <Image
          src={game.header}
          alt={game.name}
          fill
          sizes={sizes}
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-2xl text-[var(--text-muted)]">
          <FaSteam aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function ProgressBar(props: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={props.label}
      aria-valuenow={props.value}
      aria-valuemin={0}
      aria-valuemax={props.max}
      className="h-2 overflow-hidden rounded-full bg-[var(--background)]"
    >
      <div
        className="h-full rounded-full bg-blue-500"
        style={{ width: `${percent(props.value, props.max)}%` }}
      />
    </div>
  );
}

const rarityTiers = [
  { below: 5, label: "Ultra rare", style: "bg-amber-500/10 text-amber-400" },
  { below: 15, label: "Rare", style: "bg-purple-500/10 text-purple-400" },
  { below: 40, label: "Uncommon", style: "bg-blue-500/10 text-blue-400" },
];

export function RarityBadge({ pct }: { pct?: number | null }) {
  if (pct == null) return null;
  const tier = rarityTiers.find((t) => pct < t.below);
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${tier?.style ?? "bg-[var(--background)] text-[var(--text-muted)]"}`}
    >
      {tier?.label ?? "Common"} · {pct}%
    </span>
  );
}

export function GameCard(props: { game: Game; onClick: () => void }) {
  const { game, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View details for ${game.name}`}
      className={`group block w-full min-w-0 overflow-hidden text-left transition duration-200 hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-blue-400 ${card}`}
    >
      <Thumb
        game={game}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="aspect-[460/215]"
      />
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold" title={game.name}>
          {game.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          <FaClock className="mr-1 inline text-blue-400" aria-hidden="true" />
          {hours(game.minutesTotal)}h total
        </p>
        {game.minutes2Weeks >= 30 && (
          <p className="mt-1 text-xs text-blue-400">
            {hours(game.minutes2Weeks)}h in last 2 weeks
          </p>
        )}
      </div>
    </button>
  );
}

export function Section(props: {
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
}) {
  const { title, subtitle, action, children } = props;
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className={`mt-1 ${muted}`}>{subtitle}</p>
        </div>
        {action && (
          <button type="button" onClick={action.onClick} className={link}>
            {action.label}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

const PAGE_SIZE = 12;
const pageButton = `rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${card}`;

interface PlayedGamesProps {
  games: Game[];
  initialCategory?: GameFilterState["category"];
  onSelectGame: (game: Game) => void;
}

export default function PlayedGames({
  games,
  initialCategory,
  onSelectGame,
}: PlayedGamesProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<GameFilterState>({
    ...defaultGameFilters,
    ...(initialCategory ? { category: initialCategory } : {}),
  });

  const filteredGames = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const rule = categoryRules[filters.category];
    const result = games.filter(
      (g) => g.name.toLowerCase().includes(search) && (!rule || rule(g)),
    );
    const sorter = sorters[filters.sortBy];
    return sorter ? result.sort(sorter) : result;
  }, [games, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
  const pageGames = filteredGames.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function updateFilters(next: GameFilterState) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="mt-7 pb-12">
      <Section
        title="All Played Games"
        subtitle="Search and sort your full collection"
      >
        {!games.length ? (
          <p className={`p-8 text-[var(--text-muted)] ${card}`}>
            No games found.
          </p>
        ) : (
          <>
            <div className="mb-5">
              <GameFilters
                filters={filters}
                onChange={updateFilters}
                resultCount={filteredGames.length}
                totalCount={games.length}
              />
            </div>

            {!filteredGames.length ? (
              <div className={`p-8 text-center ${card}`}>
                <p className="font-semibold">No matching games</p>
                <button
                  type="button"
                  onClick={() => updateFilters({ ...defaultGameFilters })}
                  className={`mt-3 ${link}`}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {pageGames.map((game) => (
                    <GameCard
                      key={game.appid}
                      game={game}
                      onClick={() => onSelectGame(game)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className={pageButton}
                    >
                      Previous
                    </button>
                    <span className={muted}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className={pageButton}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
