import Navbar from "@/components/Navbar";
import ProfileSearch from "@/components/ProfileSearch";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
      <Navbar />

      <section className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Your gaming story starts here
        </p>

        <h2 className="max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
          How well do you know your
          <span className="text-[var(--primary)]"> Steam library?</span>
        </h2>

        <p className="mt-6 max-w-xl text-lg text-[var(--text-secondary)]">
          Search a public Steam profile and discover your gaming
          habits,favourites, and statistics.
        </p>

        <ProfileSearch />
      </section>

      <section className="pb-10 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Your games. Your stats. Your story.
        </p>
      </section>
    </main>
  );
}
