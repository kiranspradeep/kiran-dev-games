import { Metadata } from "next";
import { notFound } from "next/navigation";
import LeaderboardsClientPage from "./LeaderboardsClientPage";
import { GAME_DISPLAY, LIVE_GAME_IDS } from "@/lib/gameIdMap";

interface Props {
  params: { gameId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gameId = params.gameId.toUpperCase();
  const game = GAME_DISPLAY[gameId];
  return {
    title: game
      ? `${game.label} Leaderboard — KSP Games`
      : "Leaderboard — KSP Games",
  };
}

export default function GameLeaderboardPage({ params }: Props) {
  const gameId = params.gameId.toUpperCase();

  if (!LIVE_GAME_IDS.includes(gameId)) {
    notFound();
  }

  return <LeaderboardsClientPage gameId={gameId} />;
}