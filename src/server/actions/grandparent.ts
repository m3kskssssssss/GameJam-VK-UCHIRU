'use server'
// Grandparent task submissions and completion history.
// Actual file upload happens in /api/grandparent/upload (E.10);
// this file only writes DB records and awards rewards.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild, requireParent, assertOwnsChild } from '@/server/auth/guards'
import { getTask } from '@/server/content/grandparents'
import { awardChild } from '@/server/actions/progress'
import { deleteBlob } from '@/lib/blob'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const SubmitGrandparentTaskSchema = z.object({
  taskKey: z.string().min(1).max(128),
  photoUrl: z.string().url(),
  photoKey: z.string().min(1).max(512),
})

const ListGrandparentCompletionsSchema = z.object({
  childId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type GrandparentCompletionItem = {
  id: string
  taskKey: string
  taskName: string
  grandparent: 'GRANDMA' | 'GRANDPA'
  photoUrl: string
  coinsEarned: number
  energyEarned: number
  createdAt: Date
}

// ---------------------------------------------------------------------------
// submitGrandparentTask
// ---------------------------------------------------------------------------

export async function submitGrandparentTask(input: {
  taskKey: string
  photoUrl: string
  photoKey: string
}): Promise<{
  ok: true
  completionId: string
  coinsEarned: number
  energyEarned: number
  postId: string
}> {
  const parsed = SubmitGrandparentTaskSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()
  const { taskKey, photoUrl, photoKey } = parsed.data

  const task = getTask(taskKey)
  if (!task) throw new Error('TASK_NOT_FOUND')

  // Check for existing completion to decide reward eligibility.
  const existing = await prisma.grandparentTaskCompletion.findUnique({
    where: { childId_taskKey: { childId: child.id, taskKey } },
    select: { id: true, photoUrl: true },
  })

  const isFirst = !existing

  // Silently remove old blob when re-submitting — stale photo is no longer needed.
  if (existing) {
    deleteBlob(existing.photoUrl).catch((err) => {
      console.error('[grandparent] deleteBlob old photo failed:', err)
    })
  }

  const grandparent = task.npc === 'grandma' ? ('GRANDMA' as const) : ('GRANDPA' as const)

  const { completion, post } = await prisma.$transaction(async (tx) => {
    const completion = await tx.grandparentTaskCompletion.upsert({
      where: { childId_taskKey: { childId: child.id, taskKey } },
      create: {
        childId: child.id,
        grandparent,
        taskKey,
        taskName: task.title,
        photoUrl,
        photoKey,
        coinsEarned: isFirst ? task.rewardCoins : 0,
        energyEarned: isFirst ? task.rewardEnergy : 0,
      },
      update: { photoUrl, photoKey },
      select: { id: true },
    })

    const post = await tx.feedPost.create({
      data: {
        parentId: child.parentId,
        childId: child.id,
        kind: 'GRANDPARENT',
        title: task.title,
        photoUrl,
        photoKey,
        rewardCoins: isFirst ? task.rewardCoins : 0,
        rewardEnergy: isFirst ? task.rewardEnergy : 0,
      },
      select: { id: true },
    })

    return { completion, post }
  })

  // Award outside the transaction — awardChild runs its own atomic ops.
  if (isFirst) {
    await awardChild(child.id, { coins: task.rewardCoins, energy: task.rewardEnergy })
  }

  return {
    ok: true,
    completionId: completion.id,
    coinsEarned: isFirst ? task.rewardCoins : 0,
    energyEarned: isFirst ? task.rewardEnergy : 0,
    postId: post.id,
  }
}

// ---------------------------------------------------------------------------
// listGrandparentCompletions
// ---------------------------------------------------------------------------

export async function listGrandparentCompletions(input: {
  childId: string
}): Promise<GrandparentCompletionItem[]> {
  const parsed = ListGrandparentCompletionsSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  const rows = await prisma.grandparentTaskCompletion.findMany({
    where: { childId: parsed.data.childId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      taskKey: true,
      taskName: true,
      grandparent: true,
      photoUrl: true,
      coinsEarned: true,
      energyEarned: true,
      createdAt: true,
    },
  })

  return rows
}
