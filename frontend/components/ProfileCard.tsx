import { FaLock } from "react-icons/fa";

interface SteamProfile {
  steamid: string;
  name: string;
  avatar?: string;
  isPublic: boolean;
}

interface ProfileCardProps {
  profile: SteamProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="mt-6 w-full min-w-0 max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:shadow-lg">
      {/* Changed to flex-row so everything stays on one line */}
      <div className="flex flex-row items-center gap-3 sm:gap-4">
        {/* Profile Information */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {profile.avatar && (
            <img
              src={profile.avatar}
              alt={`${profile.name}'s avatar`}
              className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
            />
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-[var(--text-main)] sm:text-lg">
              {profile.name}
            </h3>

            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)] sm:mt-1">
              ID: {profile.steamid}
            </p>
          </div>
        </div>

        {/* Public / Private Action (shrink-0 prevents it from squishing) */}
        {profile.isPublic ? (
          <a
            href={`/dashboard/${profile.steamid}`}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary-button)] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)] sm:px-4 sm:py-3 sm:text-sm sm:gap-2"
          >
            <span>View Wrapped</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : (
          <p className="flex shrink-0 items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] sm:text-sm sm:gap-2">
            <FaLock className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline">Private</span>
            <span className="inline xs:hidden">Private</span>
          </p>
        )}
      </div>
    </div>
  );
}
