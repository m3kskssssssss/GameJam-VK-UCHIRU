// Phase 4 — R3F outdoor world entry point (server component).
// Layout enforces CHILD session via requireChild() in layout.tsx.
// This adds defence-in-depth by calling requireChild() again.

import { requireChild } from '@/server/auth/guards'
import { getChildSummary } from '@/server/actions/progress'
import { MattercraftWorld } from '@/components/world/MattercraftWorld'

export default async function PlayPage() {
  const child = await requireChild()
  const summary = await getChildSummary({ childId: child.id })

  return (
    <div className="h-dvh w-dvw overflow-hidden">
      <MattercraftWorld initialSummary={summary} />
    </div>
  )
}
