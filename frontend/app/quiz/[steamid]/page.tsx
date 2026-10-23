import { Suspense } from "react";
import SteamQuiz from "@/components/SteamQuiz";

interface QuizPageProps {
  params: Promise<{ steamid: string }>;
}

async function QuizContent({ params }: QuizPageProps) {
  const { steamid } = await params;

  return <SteamQuiz steamid={steamid} />;
}

export default function QuizPage({ params }: QuizPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-xl text-blue-400">Loading your Steam Wrapped...</p>
        </div>
      }
    >
      <QuizContent params={params} />
    </Suspense>
  );
}
