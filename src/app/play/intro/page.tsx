// First-login welcome video. Server component — bounces back to /play if the
// child has already seen the intro, otherwise renders the fullscreen player.

import { redirect } from 'next/navigation'
import { requireChild } from '@/server/auth/guards'
import { prisma } from '@/lib/db'
import { IntroPlayer } from '@/components/play/IntroPlayer'

export default async function IntroPage() {
  const child = await requireChild()

  const row = await prisma.child.findUnique({
    where: { id: child.id },
    select: { hasSeenIntro: true },
  })

  if (row?.hasSeenIntro) {
    redirect('/play')
  }

  return (
    <div className="h-dvh w-dvw overflow-hidden bg-black">
      <IntroPlayer src="/Preview.mp4" />
    </div>
  )
}
