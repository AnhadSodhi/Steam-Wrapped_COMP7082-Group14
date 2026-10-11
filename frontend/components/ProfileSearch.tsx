import { FaSearch } from "react-icons/fa";

export default function ProfileSearch() {
  return (
    <div className="mt-10 w-full max-w-2xl">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4">
          <FaSearch className="mr-3 h-5 w-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Enter Steam username or profile URL"
            className="w-full bg-transparent py-4 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        <button className="rounded-xl bg-[var(--primary-button)] px-8 py-4 font-semibold text-white transition hover:bg-[var(--primary-hover)]">
          Search
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        Only public Steam profiles can be searched.
      </p>
    </div>
  );
}
