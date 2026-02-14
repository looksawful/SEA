import { DISABLED_GAME_IDS, GAMES } from '@/utils/gameConfig'
import { GameId } from '@/types'
import { notFound } from 'next/navigation'
import { GamePageClient } from './GamePageClient'

export function generateStaticParams() {
  return Object.keys(GAMES).filter((id) => !DISABLED_GAME_IDS.has(id as GameId)).map((id) => ({
    id: id,
  }))
}

export default function GamePage({ params }: { params: { id: string } }) {
  const gameId = params.id as GameId
  if (!GAMES[gameId] || DISABLED_GAME_IDS.has(gameId)) {
    notFound()
  }
  return <GamePageClient gameId={params.id} />
}
