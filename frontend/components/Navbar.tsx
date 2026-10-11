export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      <h1 className="text-2xl font-bold">
        Steam{" "}
        <span className="text-[var(--primary)]">
          Wrapped
        </span>
      </h1>
    </nav>
  );
}