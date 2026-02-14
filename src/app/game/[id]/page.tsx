import { GameId } from "@/types";
import { DISABLED_GAME_IDS, GAMES } from "@/utils/gameConfig";
import { notFound } from "next/navigation";
import { GamePageClient } from "./GamePageClient";

export function generateStaticParams() {
  return Object.keys(GAMES).filter((id) => !DISABLED_GAME_IDS.has(id as GameId)).map((id) => ({
    id: id,
  }));
}

export default function GamePage({ params }: { params: { id: string } }) {
  const id = params.id as GameId;
  if (!GAMES[id] || DISABLED_GAME_IDS.has(id)) {
    notFound();
  }
  return <GamePageClient gameId={params.id} />;
}
