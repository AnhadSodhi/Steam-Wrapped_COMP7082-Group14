"use client";

import Image from "next/image";
import { FaChartBar, FaSteam } from "react-icons/fa";

interface ProfileHeaderProps {
  steamid: string;
  profile: {
    name: string;
    avatar?: string;
  } | null;
  showSummary: boolean;
  canShowSummary: boolean;
  onToggleSummary: () => void;
}

export default function ProfileHeader({
  steamid,
  profile,
  showSummary,
  canShowSummary,
  onToggleSummary,
}: ProfileHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          {profile?.avatar ? (
            <Image
              src={profile.avatar}
              alt={`${profile.name}'s Steam avatar`}
              width={76}
              height={76}
              unoptimized
              className="h-[76px] w-[76px] shrink-0 rounded-2xl border-2 border-blue-400/40 object-cover"
            />
          ) : (
            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
              <FaSteam className="text-3xl text-blue-400" />
            </div>
          )}

          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-400">
              Player Overview
            </p>
            <h2 className="truncate text-2xl font-bold sm:text-3xl">
              {profile?.name || "Steam Player"}
            </h2>
            <a
              href={`https://steamcommunity.com/profiles/${steamid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition hover:text-blue-400"
            >
              <FaSteam />
              View Steam profile ↗
            </a>
          </div>
        </div>

        {profile && canShowSummary && (
          <button
            type="button"
            onClick={onToggleSummary}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary-button)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-auto"
          >
            <FaChartBar />
            {showSummary ? "Hide Summary Card" : "Generate Summary Card"}
          </button>
        )}
      </div>
    </div>
  );
}
