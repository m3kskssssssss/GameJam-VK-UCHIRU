'use server'
// Currency mutations and child summary.
// awardChild() is the single entry-point for all coins/energy/xp changes.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent, requireChild, assertOwnsChild } from '@/server/auth/guards'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubjectSummary = {
  level: number
  completedLevels: number
  totalXp: number
}

export type PESubjectSummary = {
  sessionsCount: number
}

export type PerSubject = {
  math: SubjectSummary
  reading: SubjectSummary
  english: SubjectSummary
  pe: PESubjectSummary
}

export type ChildSummary = {
  id: string
  displayName: string
  coins: number
  energy: number
  homeLevel: number
  perSubject: PerSubject
}

// ---------------------------------------------------------------------------
// Home-level threshold helper (per GAME_DESIGN.md)
// Thresholds for completedLevels sum → homeLevel
// 0-9 → 1, 10-24 → 2, 25-49 → 3, 50+ → 4
// ---------------------------------------------------------------------------

export async function xpThresholdForHomeLevel(level: number): Promise<number> {
  switch (level) {
    case 1: return 0
    case 2: return 10
    case 3: return 25
    case 4: return 50
    default: return 50 + (level - 4) * 30 // extensible for future levels
  }
}

function homeLevelFromCompletedSum(sum: number): number {
  if (sum >= 50) return 4
  if (sum >= 25) return 3
  if (sum >= 10) return 2
  return 1
}

// ---------------------------------------------------------------------------
// Internal helpers (not 'use server'-exported callable externally, but
// importable by other server action files in the same process)
// ---------------------------------------------------------------------------

/** Atomically add coins (amount must be ≥ 0). */
export async function addCoins(childId: string, amount: number): Promise<void> {
  if (amount < 0) throw new Error('INVALID_INPUT')
  if (amount === 0) return
  await prisma.child.update({
    where: { id: childId },
    data: { coins: { increment: amount } },
  })
}

/** Atomically add energy capped at 200. */
export async function addEnergy(childId: string, amount: number): Promise<void> {
  if (amount < 0) throw new Error('INVALID_INPUT')
  if (amount === 0) return
  await prisma.$transaction(async (tx) => {
    const child = await tx.child.findUnique({
      where: { id: childId },
      select: { energy: true },
    })
    if (!child) throw new Error('NOT_FOUND')
    const newEnergy = Math.min(child.energy + amount, 200)
    await tx.child.update({
      where: { id: childId },
      data: { energy: newEnergy },
    })
  })
}

/** Add XP to a specific subject progress row. */
export async function addXp(
  childId: string,
  subject: 'MATH' | 'READING' | 'ENGLISH' | 'PE',
  amount: number,
): Promise<void> {
  if (amount < 0) throw new Error('INVALID_INPUT')
  if (amount === 0) return
  await prisma.subjectProgress.update({
    where: { childId_subject: { childId, subject } },
    data: { totalXp: { increment: amount } },
  })
}

/** Recompute homeLevel based on sum of completedLevels across all subjects. */
export async function recomputeHomeLevel(childId: string): Promise<void> {
  const rows = await prisma.subjectProgress.findMany({
    where: { childId },
    select: { completedLevels: true },
  })
  const total = rows.reduce((sum, r) => sum + r.completedLevels, 0)
  const newLevel = homeLevelFromCompletedSum(total)
  await prisma.child.update({
    where: { id: childId },
    data: { homeLevel: newLevel },
  })
}

// ---------------------------------------------------------------------------
// AwardChild — single entry-point for all reward grants
// ---------------------------------------------------------------------------

type AwardArgs = {
  coins?: number
  energy?: number
  xp?: number
  subject?: 'MATH' | 'READING' | 'ENGLISH' | 'PE'
}

/** Award coins, energy, and/or XP to a child in one call. */
export async function awardChild(childId: string, award: AwardArgs): Promise<void> {
  const { coins = 0, energy = 0, xp = 0, subject } = award
  // Run coin and energy mutations concurrently; XP needs the subject key.
  const tasks: Promise<void>[] = []
  if (coins > 0) tasks.push(addCoins(childId, coins))
  if (energy > 0) tasks.push(addEnergy(childId, energy))
  if (xp > 0 && subject) tasks.push(addXp(childId, subject, xp))
  await Promise.all(tasks)
}

// ---------------------------------------------------------------------------
// getChildSummary — exported server action (parent OR child)
// ---------------------------------------------------------------------------

const GetChildSummarySchema = z.object({
  childId: z.string().min(1),
})

export async function getChildSummary(input: { childId: string }): Promise<ChildSummary> {
  const parsed = GetChildSummarySchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const { childId } = parsed.data

  // Determine caller role and ownership.
  // We try requireChild first (cheap), fall back to requireParent + ownership.
  let callerIsChild = false
  let callerId: string | null = null
  try {
    const child = await requireChild()
    callerIsChild = true
    callerId = child.id
  } catch {
    // Not a child — try parent path below.
  }

  if (callerIsChild) {
    if (callerId !== childId) throw new Error('ACCESS_DENIED')
  } else {
    // Must be parent
    const parent = await requireParent()
    await assertOwnsChild(parent.id, childId)
  }

  return fetchSummary(childId)
}

// ---------------------------------------------------------------------------
// Internal fetcher shared by getChildSummary and children.ts
// ---------------------------------------------------------------------------

export async function fetchSummary(childId: string): Promise<ChildSummary> {
  const [child, progressRows, peCount] = await Promise.all([
    prisma.child.findUniqueOrThrow({
      where: { id: childId },
      select: { id: true, displayName: true, coins: true, energy: true, homeLevel: true },
    }),
    prisma.subjectProgress.findMany({
      where: { childId },
      select: { subject: true, level: true, completedLevels: true, totalXp: true },
    }),
    prisma.pESession.count({ where: { childId, completed: true } }),
  ])

  const defaultSub: SubjectSummary = { level: 1, completedLevels: 0, totalXp: 0 }

  const getSubject = (s: string): SubjectSummary => {
    const row = progressRows.find((r) => r.subject === s)
    if (!row) return defaultSub
    return { level: row.level, completedLevels: row.completedLevels, totalXp: row.totalXp }
  }

  return {
    id: child.id,
    displayName: child.displayName,
    coins: child.coins,
    energy: child.energy,
    homeLevel: child.homeLevel,
    perSubject: {
      math: getSubject('MATH'),
      reading: getSubject('READING'),
      english: getSubject('ENGLISH'),
      pe: { sessionsCount: peCount },
    },
  }
}
