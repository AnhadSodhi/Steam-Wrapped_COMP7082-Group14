"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  FaCheckCircle,
  FaExternalLinkAlt,
  FaLock,
  FaTimes,
  FaTrophy,
} from "react-icons/fa";
import {
  ProgressBar,
  RarityBadge,
  Thumb,
  card,
  hours,
  muted,
  percent,
  useFetch,
  type Game,
} from "./PlayedGames";

export type PanelGame = Pick<Game, "appid" | "name" | "header"> &
  Partial<Pick<Game, "minutesTotal" | "minutes2Weeks">>;

interface Achievement {
  apiName: string;
  name: string;
  description?: string;
  icon?: string | null;
  hidden?: boolean;
  unlocked: boolean;
  unlockedAt?: string | null;
  globalPercent?: number | null;
}

interface GameAchievements {
  total: number;
  unlocked: number;
  achievements: Achievement[]; // already sorted by the API
}

const FILTERS = ["all", "unlocked", "locked"] as const;

function AchievementRow({ a }: { a: Achievement }) {
  const description = a.description || (a.hidden ? "Hidden achievement" : "");
  return (
    <li className={`flex items-center gap-3 ${a.unlocked ? "" : "opacity-60"}`}>
      {a.icon ? (
        <Image
          src={a.icon}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 shrink-0 rounded-lg"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          {a.unlocked ? <FaTrophy /> : <FaLock />}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={a.name}>
          {a.name}
        </p>
        {description && (
          <p className="text-xs text-[var(--text-muted)]">{description}</p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={
              a.unlocked ? "text-blue-400" : "text-[var(--text-muted)]"
            }
          >
            {a.unlocked ? (
              <FaCheckCircle className="mr-1 inline" />
            ) : (
              <FaLock className="mr-1 inline" />
            )}
            {a.unlocked
              ? a.unlockedAt
                ? new Date(a.unlockedAt).toLocaleDateString()
                : "Unlocked"
              : "Locked"}
          </span>
          <RarityBadge pct={a.globalPercent} />
        </p>
      </div>
    </li>
  );
}

interface Props {
  steamid: string;
  game: PanelGame;
  onClose: () => void;
}

export default function GameDetailsPanel({ steamid, game, onClose }: Props) {
  const { data, loading } = useFetch<GameAchievements>(
    `/api/achievements/${steamid}/${game.appid}`,
  );
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const total = data?.total ?? 0;
  const unlocked = data?.unlocked ?? 0;
  const counts = { all: total, unlocked, locked: total - unlocked };
  const list = (data?.achievements ?? []).filter(
    (a) => filter === "all" || a.unlocked === (filter === "unlocked"),
  );

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close game details"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-details-title"
        className="absolute inset-y-0 right-0 w-full max-w-[520px] overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text-main)] shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Game details
          </span>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <Thumb
          game={game}
          sizes="520px"
          className="aspect-[460/215] rounded-xl"
        />
        <h2 id="game-details-title" className="mt-4 text-2xl font-bold">
          {game.name}
        </h2>

        {game.minutesTotal !== undefined && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["Total playtime", game.minutesTotal],
              ["Last 2 weeks", game.minutes2Weeks ?? 0],
            ].map(([label, minutes]) => (
              <div key={label} className={`p-4 ${card}`}>
                <p className={muted}>{label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {hours(Number(minutes))}h
                </p>
              </div>
            ))}
          </div>
        )}

        <section className={`mt-4 p-4 ${card}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold">Achievements</h3>
            {total > 0 && (
              <span className="text-sm font-semibold text-blue-400">
                {unlocked}/{total} · {percent(unlocked, total)}%
              </span>
            )}
          </div>

          {loading ? (
            <p className={muted}>Loading achievements...</p>
          ) : !total ? (
            <p className={muted}>
              No achievements are available for this game.
            </p>
          ) : (
            <>
              <ProgressBar
                value={unlocked}
                max={total}
                label="Achievements unlocked"
              />

              <div className="mt-4 flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      filter === f
                        ? "bg-blue-500 text-white"
                        : "bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {f} ({counts[f]})
                  </button>
                ))}
              </div>

              <ul className="mt-4 space-y-4">
                {list.map((a) => (
                  <AchievementRow key={a.apiName} a={a} />
                ))}
              </ul>
            </>
          )}
        </section>

        <a
          href={`https://store.steampowered.com/app/${game.appid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
        >
          View on Steam <FaExternalLinkAlt aria-hidden="true" />
        </a>
      </aside>
    </div>
  );
}
