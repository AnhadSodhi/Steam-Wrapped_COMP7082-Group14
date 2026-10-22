"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import {
  FaChartBar,
  FaCheck,
  FaDownload,
  FaFacebook,
  FaInstagram,
  FaLink,
  FaLinkedin,
  FaTimes,
  FaTwitter,
} from "react-icons/fa";

interface SteamProfile {
  name: string;
  avatar?: string;
}

interface Totals {
  gamesOwned: number;
  gamesPlayed: number;
  hoursPlayed: number;
  hoursLast2Weeks: number;
}

interface TopGame {
  name: string;
  hoursLast2Weeks: number;
  hoursTotal: number;
  genre: string;
}

interface PlayedGame {
  name: string;
  hours: number;
}

interface SummaryCardProps {
  profile: SteamProfile;
  totals: Totals;
  topGame?: TopGame;
  topGames: PlayedGame[];
  onClose: () => void;
}

function getRecentDescriptor(hours: number) {
  if (hours >= 40) return "Relentless";
  if (hours >= 15) return "Rising";
  if (hours >= 5) return "Keen";
  return "Curious";
}

function getLifetimeDescriptor(hours: number) {
  if (hours >= 1000) return "Legendary";
  if (hours >= 250) return "Veteran";
  if (hours >= 50) return "Seasoned";
  return "New";
}

function getGenreRole(genre: string) {
  const normalizedGenre = genre.toLowerCase();
  if (normalizedGenre.includes("racing")) return "Speedster";
  if (normalizedGenre.includes("sports")) return "Competitor";
  if (normalizedGenre.includes("strategy")) return "Tactician";
  if (normalizedGenre.includes("simulation")) return "Architect";
  if (normalizedGenre.includes("role-playing") || normalizedGenre.includes("rpg")) {
    return "Questmaster";
  }
  if (normalizedGenre.includes("shooter")) return "Sharpshooter";
  if (normalizedGenre.includes("adventure")) return "Explorer";
  if (normalizedGenre.includes("action")) return "Actioneer";
  if (normalizedGenre.includes("indie")) return "Trailblazer";
  return "Player";
}

export default function SummaryCard({
  profile,
  totals,
  topGame,
  topGames,
  onClose,
}: SummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const cardRef = useRef<HTMLElement>(null);
  const shareUrl =
    typeof window === "undefined" ? "" : window.location.href;
  const title = topGame
    ? `${getRecentDescriptor(topGame.hoursLast2Weeks)} ${getLifetimeDescriptor(topGame.hoursTotal)} ${getGenreRole(topGame.genre)}`
    : "Your Steam Wrapped summary";

  const renderCard = async () => {
    if (!cardRef.current) throw new Error("Summary card is not ready.");
    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
  };

  const downloadCard = async () => {
    setActionError("");
    try {
      const dataUrl = await renderCard();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${profile.name.replace(/[^a-z0-9]/gi, "-")}-steam-wrapped.png`;
      link.click();
    } catch {
      setActionError("Unable to create the PNG. Please try again.");
    }
  };

  const copyLink = async () => {
    setActionError("");
    try {
      const imageUrl = await renderCard();
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setActionError("Unable to copy the card image link. Please try again.");
      return false;
    }
  };

  const shareToInstagram = async () => {
    setActionError("");
    try {
      const dataUrl = await renderCard();
      const response = await fetch(dataUrl);
      const image = new File([await response.blob()], "steam-wrapped.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [image] })) {
        await navigator.share({
          title: `${profile.name}'s Steam Wrapped`,
          text: `Check out ${profile.name}'s Steam Wrapped summary.`,
          files: [image],
        });
        return;
      }

      const imageCopied = await copyLink();
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      if (imageCopied) {
        setActionError(
          "The PNG was not shareable from this browser. The card image link was copied; upload the downloaded PNG to Instagram.",
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setActionError("Unable to prepare the Instagram share.");
    }
  };

  return (
    <section
      ref={cardRef}
      aria-label={`${profile.name}'s Steam Wrapped summary`}
      className="relative mt-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.3),_transparent_45%)]" />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-button)]">
                <FaChartBar className="text-xl text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Steam Wrapped
              </p>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary card"
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text-main)]"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-xs text-[var(--text-muted)]">Games owned</p>
            <p className="mt-1 text-2xl font-bold">{totals.gamesOwned}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-xs text-[var(--text-muted)]">Games played</p>
            <p className="mt-1 text-2xl font-bold">{totals.gamesPlayed}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-xs text-[var(--text-muted)]">Hours played</p>
            <p className="mt-1 text-2xl font-bold">{totals.hoursPlayed}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-xs text-[var(--text-muted)]">Last 2 weeks</p>
            <p className="mt-1 text-2xl font-bold">{totals.hoursLast2Weeks}h</p>
          </div>
        </div>

        {topGame && (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-black/10 px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">Most played game</p>
            <p className="mt-1 truncate font-semibold">
              {topGame.name}
              <span className="ml-2 font-normal text-[var(--text-secondary)]">
                {topGame.hoursLast2Weeks.toFixed(1)} hrs in the last 2 weeks
              </span>
            </p>
          </div>
        )}

        {topGames.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-black/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Top games by playtime</p>
              <span className="text-xs text-[var(--text-muted)]">hours</span>
            </div>
            <div className="space-y-3">
              {topGames.map((game) => {
                const maxHours = topGames[0].hours || 1;
                const width = Math.max((game.hours / maxHours) * 100, 4);
                return (
                  <div key={game.name}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate text-[var(--text-secondary)]">
                        {game.name}
                      </span>
                      <span className="shrink-0">{game.hours.toFixed(1)}h</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={downloadCard}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          >
            <FaDownload /> Download
          </button>
          <button
            type="button"
            onClick={shareToInstagram}
            aria-label="Share to Instagram"
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10"
          >
            <FaInstagram />
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${profile.name}'s Steam Wrapped summary`)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X"
            className="rounded-xl border border-[var(--border)] p-3 transition hover:bg-white/10"
          >
            <FaTwitter />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            className="rounded-xl border border-[var(--border)] p-3 transition hover:bg-white/10"
          >
            <FaFacebook />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on LinkedIn"
            className="rounded-xl border border-[var(--border)] p-3 transition hover:bg-white/10"
          >
            <FaLinkedin />
          </a>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy card image link"
            className="rounded-xl border border-[var(--border)] p-3 transition hover:bg-white/10"
          >
            {copied ? <FaCheck className="text-green-400" /> : <FaLink />}
          </button>
        </div>
        {actionError && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {actionError}
          </p>
        )}
      </div>
    </section>
  );
}
