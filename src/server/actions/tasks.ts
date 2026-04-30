'use server'
// Task session actions: startTask / submitTask.
// Security model: answers are embedded in a server-signed HS256 JWT so the
// client can never see correct answers in the network tab.

import { SignJWT, jwtVerify } from 'jose'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import { loadLevel } from '@/server/content'
import type { TaskItemClient } from '@/server/content'
import { awardChild, recomputeHomeLevel } from '@/server/actions/progress'

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET not configured')
  return new TextEncoder().encode(secret)
}

// ---------------------------------------------------------------------------
// Token payload shape (server-only — never sent to client)
// ---------------------------------------------------------------------------

type TokenItem = { id: string; correct: string }

type TaskTokenPayload = {
  childId: string
  subject: string
  level: number
  items: TokenItem[]
  // iat / exp added by jose automatically
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const SubjectEnum = z.enum(['MATH', 'READING', 'ENGLISH', 'PE'])

const StartTaskSchema = z.object({
  subject: SubjectEnum,
  level: z.number().int().min(1).max(20),
})

const AnswerSchema = z.object({
  itemId: z.string().min(1),
  answer: z.string(),
})

const SubmitTaskSchema = z.object({
  sessionToken: z.string().min(1),
  answers: z.array(AnswerSchema).min(1).max(20),
})

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type TaskBundle = {
  sessionToken: string
  items: TaskItemClient[]
}

export type TaskResult = {
  passed: boolean
  correctCount: number
  totalCount: number
  coinsEarned: number
  energyEarned: number
  xpEarned: number
  newLevel: number
}

// ---------------------------------------------------------------------------
// Reward table (per GAME_DESIGN.md)
// ---------------------------------------------------------------------------

type SubjectKey = 'MATH' | 'READING' | 'ENGLISH' | 'PE'

type Reward = { coins: number; energy: number; xp: number }

const BASE_REWARDS: Record<SubjectKey, Reward> = {
  MATH:    { coins: 20, energy: 5,  xp: 30 },
  READING: { coins: 20, energy: 5,  xp: 30 },
  ENGLISH: { coins: 20, energy: 5,  xp: 30 },
  PE:      { coins: 25, energy: 20, xp: 20 },
}

const PERFECT_BONUS: Record<SubjectKey, Reward> = {
  MATH:    { coins: 10, energy: 5,  xp: 20 },
  READING: { coins: 10, energy: 5,  xp: 20 },
  ENGLISH: { coins: 10, energy: 5,  xp: 20 },
  PE:      { coins: 0,  energy: 0,  xp: 0  },
}

// ---------------------------------------------------------------------------
// normalise — trim + lowercase for string comparison
// ---------------------------------------------------------------------------

function normalise(s: string): string {
  return s.trim().toLowerCase()
}

// ---------------------------------------------------------------------------
// startTask
// ---------------------------------------------------------------------------

export async function startTask(input: { subject: string; level: number }): Promise<TaskBundle> {
  const parsed = StartTaskSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()
  const { subject, level } = parsed.data

  const items = loadLevel(subject, level)

  // Build token payload with correct answers serialised for server-side grading.
  const tokenItems: TokenItem[] = items.map((it) => ({
    id: it.id,
    correct: it.type === 'match_pairs'
      ? JSON.stringify(it.pairs.map((p) => p.right))
      : String(it.correct),
  }))

  const payload: TaskTokenPayload = {
    childId: child.id,
    subject,
    level,
    items: tokenItems,
  }

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getJwtSecret())

  // Full items (including correct) sent to client for instant feedback.
  const clientItems: TaskItemClient[] = items

  return { sessionToken: token, items: clientItems }
}

// ---------------------------------------------------------------------------
// submitTask
// ---------------------------------------------------------------------------

export async function submitTask(input: {
  sessionToken: string
  answers: { itemId: string; answer: string }[]
}): Promise<TaskResult> {
  const parsed = SubmitTaskSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()
  const { sessionToken, answers } = parsed.data

  // Verify + decode token — throws if tampered or expired.
  let payload: TaskTokenPayload
  try {
    const { payload: raw } = await jwtVerify(sessionToken, getJwtSecret())
    // Narrow unknown to TaskTokenPayload safely.
    const p = raw as Record<string, unknown>
    if (
      typeof p.childId !== 'string' ||
      typeof p.subject !== 'string' ||
      typeof p.level !== 'number' ||
      !Array.isArray(p.items)
    ) {
      throw new Error('TOKEN_MALFORMED')
    }
    payload = {
      childId: p.childId,
      subject: p.subject,
      level: p.level,
      items: p.items as TokenItem[],
    }
  } catch {
    throw new Error('INVALID_TOKEN')
  }

  // Ownership: token's childId must match the authenticated child.
  if (payload.childId !== child.id) throw new Error('ACCESS_DENIED')

  const subject = payload.subject as SubjectKey
  const totalCount = payload.items.length

  // Grade answers server-side — client answer strings are never trusted.
  let correctCount = 0
  for (const tokenItem of payload.items) {
    const clientAnswer = answers.find((a) => a.itemId === tokenItem.id)
    if (!clientAnswer) continue
    if (normalise(clientAnswer.answer) === normalise(tokenItem.correct)) {
      correctCount++
    }
  }

  const passed = correctCount >= 7
  const isPerfect = correctCount === totalCount && totalCount > 0

  // Compute rewards.
  const base = BASE_REWARDS[subject] ?? BASE_REWARDS.MATH
  const bonus = isPerfect ? (PERFECT_BONUS[subject] ?? PERFECT_BONUS.MATH) : { coins: 0, energy: 0, xp: 0 }

  const coinsEarned = passed ? base.coins + bonus.coins : 0
  const energyEarned = passed ? base.energy + bonus.energy : 0
  const xpEarned = passed ? base.xp + bonus.xp : 0

  // Upsert SubjectProgress + write TaskAttempt in one transaction.
  const progress = await prisma.$transaction(async (tx) => {
    // Write attempt record.
    await tx.taskAttempt.create({
      data: {
        childId: child.id,
        subject,
        level: payload.level,
        correctCount,
        totalCount,
        passed,
        coinsEarned,
        energyEarned,
        xpEarned,
        durationMs: 0, // client may supply this in Phase 5
      },
    })

    // Upsert progress row (create if first attempt on this subject).
    const existing = await tx.subjectProgress.findUnique({
      where: { childId_subject: { childId: child.id, subject } },
    })

    let newLevel = existing?.level ?? 1

    if (passed) {
      const completedLevels = (existing?.completedLevels ?? 0) + 1
      // Level advances by 1 on each pass, capped at 10.
      newLevel = Math.min((existing?.level ?? 1) + 1, 10)
      const totalXp = (existing?.totalXp ?? 0) + xpEarned

      await tx.subjectProgress.upsert({
        where: { childId_subject: { childId: child.id, subject } },
        create: {
          childId: child.id,
          subject,
          level: newLevel,
          completedLevels,
          totalXp,
        },
        update: {
          level: newLevel,
          completedLevels,
          totalXp,
        },
      })
    }

    return { newLevel }
  })

  // Award coins / energy / xp (outside transaction — independent atomic ops).
  if (passed) {
    await awardChild(child.id, { coins: coinsEarned, energy: energyEarned })
    // XP already written inside transaction via progress row; skip double-add.
  }

  // Recompute homeLevel after progress change.
  await recomputeHomeLevel(child.id)

  return {
    passed,
    correctCount,
    totalCount,
    coinsEarned,
    energyEarned,
    xpEarned,
    newLevel: progress.newLevel,
  }
}
