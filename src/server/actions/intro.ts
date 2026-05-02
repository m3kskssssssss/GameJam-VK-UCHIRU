'use server'
// Welcome-intro flag toggling. Called once when a child finishes (or skips)
// the welcome video so the gate at /play stops redirecting them.

import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'

export async function markIntroWatched(): Promise<void> {
  const child = await requireChild()
  await prisma.child.update({
    where: { id: child.id },
    data: { hasSeenIntro: true },
  })
}
