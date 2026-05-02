// Phase 4 — R3F outdoor world entry point (server component).
// Layout enforces CHILD session via requireChild() in layout.tsx.
// This adds defence-in-depth by calling requireChild() again, and also gates
// first-time players to the welcome video at /play/intro.

import { redirect } from 'next/navigation'
import { requireChild } from '@/server/auth/guards'
import { getChildSummary } from '@/server/actions/progress'
import { prisma } from '@/lib/db'
import { MattercraftWorld } from '@/components/world/MattercraftWorld'

export default async function PlayPage() {
  const child = await requireChild()

  // First-login welcome video — show once, then never again. Reading this
  // alongside the summary keeps the gate in a single round-trip.
  const [summary, intro] = await Promise.all([
    getChildSummary({ childId: child.id }),
    prisma.child.findUnique({
      where: { id: child.id },
      select: { hasSeenIntro: true },
    }),
  ])

  if (!intro?.hasSeenIntro) {
    redirect('/play/intro')
  }

  return (
    <div className="h-dvh w-dvw overflow-hidden">
      <MattercraftWorld initialSummary={summary} />
    </div>
  )
}
