import { Suspense } from "react";
import Compare from "@/components/Compare";

type Params = Promise<{ steamid: string }>;

async function CompareContent({ params }: { params: Params }) {
  const { steamid } = await params;
  return <Compare steamid={steamid} />;
}

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0b1220]" />}>
      <CompareContent params={params} />
    </Suspense>
  );
}
