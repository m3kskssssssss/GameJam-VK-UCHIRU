// Reaction lobby mini-game page (server component).
import { requireChild } from '@/server/auth/guards'
import { ReactionGame } from '@/components/lobby/games/ReactionGame'

export default async function ReactionGamePage({
  searchParams,
}: {
  searchParams: Promise<{ opponent?: string }>
}) {
  await requireChild()
  const { opponent } = await searchParams
  return <ReactionGame opponentName={opponent} />
}
