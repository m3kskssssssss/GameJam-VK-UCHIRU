// Forest coin-collection lobby mini-game page (server component).
// Reads child gender for the 3D character; opponent name comes from query.

import { requireChild } from '@/server/auth/guards'
import { prisma } from '@/lib/db'
import { ForestGame } from '@/components/lobby/games/ForestGame'

export default async function ForestGamePage({
  searchParams,
}: {
  searchParams: Promise<{ opponent?: string }>
}) {
  const child = await requireChild()
  const row = await prisma.child.findUnique({
    where: { id: child.id },
    select: { gender: true },
  })
  const gender = row?.gender === 'GIRL' ? 'GIRL' : 'BOY'
  const { opponent } = await searchParams

  return <ForestGame gender={gender} opponentName={opponent} />
}
