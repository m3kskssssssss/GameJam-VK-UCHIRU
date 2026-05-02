// Pair-match lobby mini-game page (server component).
import { requireChild } from '@/server/auth/guards'
import { PairsGame } from '@/components/lobby/games/PairsGame'

export default async function PairsGamePage({
  searchParams,
}: {
  searchParams: Promise<{ opponent?: string }>
}) {
  await requireChild()
  const { opponent } = await searchParams
  return <PairsGame opponentName={opponent} />
}
