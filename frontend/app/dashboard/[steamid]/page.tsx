import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

interface DashboardPageProps {
  params: Promise<{ steamid: string }>;
}

async function DashboardContent({ params }: DashboardPageProps) {
  const { steamid } = await params;
  return <Dashboard steamid={steamid} />;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-[var(--text-muted)]">Loading dashboard...</p>
      }
    >
      <DashboardContent params={params} />
    </Suspense>
  );
}
