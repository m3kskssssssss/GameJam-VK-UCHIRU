import { notFound } from 'next/navigation'
import { requireChild } from '@/server/auth/guards'
import { prisma } from '@/lib/db'
import { DialogScene } from '@/components/dialog/DialogScene'

type NpcSlug = 'grandma' | 'grandpa'

function isValidNpc(value: string): value is NpcSlug {
  return value === 'grandma' || value === 'grandpa'
}

export default async function TalkPage({
  params,
}: {
  params: Promise<{ npc: string }>
}) {
  const { npc } = await params

  if (!isValidNpc(npc)) {
    notFound()
  }

  const child = await requireChild()

  const record = await prisma.child.findUnique({
    where: { id: child.id },
    select: { gender: true },
  })

  if (!record) {
    notFound()
  }

  const completions = await prisma.grandparentTaskCompletion.findMany({
    where: {
      childId: child.id,
      grandparent: npc === 'grandma' ? 'GRANDMA' : 'GRANDPA',
    },
    select: { taskKey: true },
  })

  const completedTaskKeys = completions.map((c) => c.taskKey)

  return (
    <DialogScene
      npc={npc}
      childGender={record.gender}
      completedTaskKeys={completedTaskKeys}
    />
  )
}
