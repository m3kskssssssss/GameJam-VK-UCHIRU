'use server'
// Task session actions: startTask / submitTask.
// Security model: answers are embedded in a server-signed HS256 JWT.
// As of the grade-1..7 overhaul, the client receives full TaskItems
// (including `correct`) for instant feedback. Server-side grading stays
// authoritative — submitTask re-validates every answer against the JWT payload.

import { SignJWT, jwtVerify } from 'jose'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import { loadLevel, isAnswerCorrect } from '@/server/content'
import type { TaskItem, TaskItemClient, AnswerValue } from '@/server/content'
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

type TaskTokenPayload = {
  childId: string
  subject: string
  grade: number
  level: number
  items: TaskItem[]
  // iat / exp added by jose automatically
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const SubjectEnum = z.enum(['MATH', 'READING', 'ENGLISH', 'PE'])

const StartTaskSchema = z.object({
  subject: SubjectEnum,
  grade: z.number().int().min(1).max(7).optional(),
  level: z.number().int().min(1).max(20),
})

const AnswerSchema = z.object({
  itemId: z.string().min(1),
  // Encoded answer (string). For boolean → "true"/"false", for arrays → comma-joined.
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

// Russian subject titles used in feed post titles like "Математика — уровень 3
// пройден". "Уровень" is masculine so the participle "пройден" works for any
// child gender — no need to read child.gender just for grammar.
const SUBJECT_TITLES_RU: Record<SubjectKey, string> = {
  MATH: 'Математика',
  READING: 'Чтение',
  ENGLISH: 'Английский',
  PE: 'Физкультура',
}

const PERFECT_BONUS: Record<SubjectKey, Reward> = {
  MATH:    { coins: 10, energy: 5,  xp: 20 },
  READING: { coins: 10, energy: 5,  xp: 20 },
  ENGLISH: { coins: 10, energy: 5,  xp: 20 },
  PE:      { coins: 0,  energy: 0,  xp: 0  },
}

// ---------------------------------------------------------------------------
// Decode a string-encoded answer back to AnswerValue for the given task.
// Mirrors the encoding done by the client (see TaskItemRenderer.serializeAnswer).
// ---------------------------------------------------------------------------

function decodeAnswer(task: TaskItem, raw: string): AnswerValue {
  switch (task.type) {
    case 'true_false': {
      const v = raw.trim().toLowerCase()
      return v === 'true' || v === 'да' || v === '1'
    }
    case 'match_pairs':
      return raw.split(',').map((s) => s.trim())
    case 'multiple_choice':
    case 'text_input':
    case 'fill_blank':
    default:
      return raw
  }
}

// ---------------------------------------------------------------------------
// startTask
// ---------------------------------------------------------------------------

export async function startTask(input: {
  subject: string
  grade?: number
  level: number
}): Promise<TaskBundle> {
  const parsed = StartTaskSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()
  const { subject, level } = parsed.data

  // Use the child's stored grade unless an explicit grade is provided in input.
  const grade = parsed.data.grade ?? (await getChildGrade(child.id))

  const items = loadLevel(subject, grade, level)

  const payload: TaskTokenPayload = {
    childId: child.id,
    subject,
    grade,
    level,
    items,
  }

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(getJwtSecret())

  // Full items (including correct) sent to client for instant feedback.
  return { sessionToken: token, items }
}

async function getChildGrade(childId: string): Promise<number> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { grade: true },
  })
  return child?.grade ?? 1
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
      grade: typeof p.grade === 'number' ? p.grade : 1,
      level: p.level,
      items: p.items as TaskItem[],
    }
  } catch {
    throw new Error('INVALID_TOKEN')
  }

  // Ownership: token's childId must match the authenticated child.
  if (payload.childId !== child.id) throw new Error('ACCESS_DENIED')

  const subject = payload.subject as SubjectKey
  const totalCount = payload.items.length

  // Grade answers server-side using the same logic as client (isAnswerCorrect).
  let correctCount = 0
  for (const task of payload.items) {
    const clientAnswer = answers.find((a) => a.itemId === task.id)
    if (!clientAnswer) continue
    const decoded = decodeAnswer(task, clientAnswer.answer)
    if (isAnswerCorrect(task, decoded)) {
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

  // Publish a feed post so the parent (and relatives) see the level-pass event
  // alongside PE photos and grandparent submissions. Skip PE here — those go
  // through /api/pe/upload which already creates the FeedPost with a photo.
  if (passed && subject !== 'PE' && child.parentId) {
    try {
      await prisma.feedPost.create({
        data: {
          parentId: child.parentId,
          childId: child.id,
          kind: 'TASK',
          title: `${SUBJECT_TITLES_RU[subject]} — уровень ${payload.level} пройден`,
          rewardCoins: coinsEarned,
          rewardEnergy: energyEarned,
        },
      })
    } catch (err) {
      // Don't fail the player's submission if the feed write fails.
      console.error('[tasks] feed post creation failed:', err)
    }
  }

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
