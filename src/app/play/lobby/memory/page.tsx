// Memory (Simon-says) lobby mini-game page (server component).
import { requireChild } from '@/server/auth/guards'
import { MemoryGame } from '@/components/lobby/games/MemoryGame'

export default async function MemoryGamePage({
  searchParams,
}: {
  searchParams: Promise<{ opponent?: string }>
}) {
  await requireChild()
  const { opponent } = await searchParams
  return <MemoryGame opponentName={opponent} />
}
