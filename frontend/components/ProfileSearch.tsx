"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import ProfileCard from "./ProfileCard";

interface SteamProfile {
  steamid: string;
  name: string;
  avatar: string;
  profileUrl: string;
  isPublic: boolean;
}

export default function ProfileSearch() {
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<SteamProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setProfile(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 w-full max-w-2xl">
      <form
        onSubmit={handleSearch}
        className="flex w-full flex-col gap-3 sm:flex-row"
      >
        <div className="flex flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4">
          <FaSearch className="mr-3 h-5 w-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Enter Steam username or profile URL"
            className="w-full bg-transparent py-4 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[var(--primary-button)] px-8 py-4 font-semibold text-white transition hover:bg-[var(--primary-hover)]"
        >
          Search
        </button>
      </form>
      {/* Error Message */}
      {error && (
        <p role="alert" className="mt-4 text-center text-red-500">
          {error}
        </p>
      )}

      {profile && <ProfileCard profile={profile} />}

      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        Only public Steam profiles can be searched.
      </p>
    </div>
  );
}
