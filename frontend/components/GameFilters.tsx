"use client";

import { FaSearch, FaUndo } from "react-icons/fa";

export type FilterCategory = "all" | "recent" | "light" | "marathon";
export type SortOption = "most" | "least" | "recent" | "name";

export interface GameFilterState {
  search: string;
  category: FilterCategory;
  sortBy: SortOption;
}

export const defaultGameFilters: GameFilterState = {
  search: "",
  category: "all",
  sortBy: "most",
};

interface GameFiltersProps {
  filters: GameFilterState;
  onChange: (filters: GameFilterState) => void;
  resultCount: number;
  totalCount: number;
}

const categories: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All Games" },
  { id: "recent", label: "Recent Activity" },
  { id: "light", label: "Barely Played" },
  { id: "marathon", label: "100+ Hours" },
];

export default function GameFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
}: GameFiltersProps) {
  const update = (changes: Partial<GameFilterState>) =>
    onChange({ ...filters, ...changes });

  const hasFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.sortBy !== "most";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />

          <input
            type="search"
            aria-label="Search games"
            placeholder="Search your games..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 pl-11 text-sm"
          />
        </div>

        <select
          aria-label="Sort games"
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as SortOption })}
          className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
        >
          <option value="most">Most Played</option>
          <option value="least">Least Played</option>
          <option value="recent">Most Active Lately</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={filters.category === category.id}
            onClick={() => update({ category: category.id })}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              filters.category === category.id
                ? "border-transparent bg-[var(--primary-button)] text-white"
                : "border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)]"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Results and Reset */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm">
        <span className="text-[var(--text-muted)]">
          Showing {resultCount} of {totalCount} games
        </span>

        {hasFilters && (
          <button
            type="button"
            onClick={() => onChange(defaultGameFilters)}
            className="flex items-center gap-2 text-blue-400"
          >
            <FaUndo />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
