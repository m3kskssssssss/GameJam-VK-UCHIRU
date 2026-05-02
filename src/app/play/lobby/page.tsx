// Phase 7 — Lobby landing page (server component).
// Renders the GLB-based lobby scene with the player's 3D character. One door
// in the corner is wrapped in a portal that pushes into the multi-player arena.

import { requireChild } from '@/server/auth/guards'
import { prisma } from '@/lib/db'
import { getChildSummary } from '@/server/actions/progress'
import { LobbyWorld } from '@/components/world/LobbyWorld'

export default async function LobbyPage() {
  const child = await requireChild()
  const [row, summary] = await Promise.all([
    prisma.child.findUnique({
      where: { id: child.id },
      select: { gender: true },
    }),
    getChildSummary({ childId: child.id }),
  ])
  const gender = row?.gender === 'GIRL' ? 'GIRL' : 'BOY'

  return (
    <div className="h-dvh w-dvw overflow-hidden">
      <LobbyWorld gender={gender} initialSummary={summary} />
    </div>
  )
}
