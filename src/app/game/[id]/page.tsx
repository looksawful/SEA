import { GAME_ORDER, GAMES } from '@/utils/gameConfig'
import { GameId } from '@/types'
import { notFound } from 'next/navigation'
import { GamePageClient } from './GamePageClient'

export function generateStaticParams() {
  return GAME_ORDER.map((id) => ({
    id: id,
  }))
}

export default function GamePage({ params }: { params: { id: string } }) {
  if (!GAMES[params.id as GameId]) {
    notFound()
  }
  return <GamePageClient gameId={params.id} />
}
