'use server'
// PE session actions: startPESession / completePESession.
// XP is intentionally skipped for PE — progress is tracked via PESession count,
// not SubjectProgress rows (which require a completed-level concept PE doesn't have).

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import { getPEExercise } from '@/server/content/pe'
import { awardChild, recomputeHomeLevel } from '@/server/actions/progress'

// ---------------------------------------------------------------------------
// Reward constants (per GAME_DESIGN.md — PE: +25 coins, +20 energy, +20 XP)
// XP skipped — no SubjectProgress row exists for PE.
// ---------------------------------------------------------------------------

const PE_COINS = 25
const PE_ENERGY = 20

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const StartPESessionSchema = z.object({
  exerciseKey: z.string().min(1).max(64),
})

const CompletePESessionSchema = z.object({
  sessionId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type PEResult = {
  coinsEarned: number
  energyEarned: number
  xpEarned: number
}

// ---------------------------------------------------------------------------
// startPESession
// ---------------------------------------------------------------------------

export async function startPESession(input: {
  exerciseKey: string
}): Promise<{ sessionId: string }> {
  const parsed = StartPESessionSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()
  const { exerciseKey } = parsed.data

  // getPEExercise throws 'EXERCISE_NOT_FOUND' if key is not in catalog.
  const exercise = getPEExercise(exerciseKey)

  const session = await prisma.pESession.create({
    data: {
      childId: child.id,
      exerciseKey: exercise.key,
      // Snapshot the name so history is stable even if catalog changes.
      exerciseName: exercise.name,
      completed: false,
    },
    select: { id: true },
  })

  return { sessionId: session.id }
}

// ---------------------------------------------------------------------------
// completePESession
// ---------------------------------------------------------------------------

export async function completePESession(input: {
  sessionId: string
}): Promise<PEResult> {
  const parsed = CompletePESessionSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()
  const { sessionId } = parsed.data

  const session = await prisma.pESession.findUnique({
    where: { id: sessionId },
    select: { id: true, childId: true, completed: true },
  })

  if (!session) throw new Error('NOT_FOUND')
  // Ownership check: the session must belong to the authenticated child.
  if (session.childId !== child.id) throw new Error('ACCESS_DENIED')
  if (session.completed) throw new Error('ALREADY_COMPLETED')

  // Mark complete and record earned amounts in a single transaction.
  await prisma.$transaction(async (tx) => {
    await tx.pESession.update({
      where: { id: sessionId },
      data: {
        completed: true,
        coinsEarned: PE_COINS,
        energyEarned: PE_ENERGY,
      },
    })
  })

  // Award outside the transaction — awardChild runs its own atomic ops.
  await awardChild(child.id, { coins: PE_COINS, energy: PE_ENERGY })

  // Recompute homeLevel (PE sessions don't affect completedLevels sum, but
  // call it anyway to keep the pattern consistent with submitTask).
  await recomputeHomeLevel(child.id)

  return {
    coinsEarned: PE_COINS,
    energyEarned: PE_ENERGY,
    // XP is not tracked via SubjectProgress for PE; report 0 to the client.
    xpEarned: 0,
  }
}
