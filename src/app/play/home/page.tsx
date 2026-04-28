// Phase 6 — /play/home server component.
// Fetches all home data in parallel and passes to the MainHouse client shell.

import { redirect } from 'next/navigation'
import { requireChild } from '@/server/auth/guards'
import { prisma } from '@/lib/db'
import { listRooms, listInventory } from '@/server/actions/rooms'
import { MainHouse } from '@/components/home-house/MainHouse'

export default async function HomePage() {
  const child = await requireChild()

  const [rooms, inventory, appearance, fresh] = await Promise.all([
    listRooms(),
    listInventory(),
    prisma.characterAppearance.findUnique({ where: { childId: child.id } }),
    prisma.child.findUnique({
      where: { id: child.id },
      select: { coins: true, energy: true, homeLevel: true },
    }),
  ])

  if (!fresh) redirect('/auth/login')

  // Defensive: ensure appearance row exists for new children.
  const finalAppearance =
    appearance ??
    (await prisma.characterAppearance.create({
      data: { childId: child.id },
    }))

  return (
    <div className="min-h-dvh w-dvw overflow-hidden bg-[--color-background]">
      <MainHouse
        initialRooms={rooms}
        initialInventory={inventory}
        initialAppearance={{
          hair: finalAppearance.hair,
          top: finalAppearance.top,
          bottom: finalAppearance.bottom,
          petKey: finalAppearance.petKey,
        }}
        coins={fresh.coins}
        energy={fresh.energy}
        homeLevel={fresh.homeLevel}
      />
    </div>
  )
}
