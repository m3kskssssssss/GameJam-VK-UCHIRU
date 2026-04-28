'use server'
// Parent-side child management: list, detail, attempts, PE sessions, delete.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent, assertOwnsChild } from '@/server/auth/guards'
import { fetchSummary } from '@/server/actions/progress'
import type { ChildSummary } from '@/server/actions/progress'

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type { ChildSummary }

export type ChildDetail = ChildSummary & {
  username: string
  createdAt: Date
}

export type TaskAttemptRecord = {
  id: string
  subject: string
  level: number
  correctCount: number
  totalCount: number
  passed: boolean
  coinsEarned: number
  energyEarned: number
  xpEarned: number
  durationMs: number
  createdAt: Date
}

export type PESessionRecord = {
  id: string
  exerciseName: string
  exerciseKey: string
  // TODO (Phase 5): when Vercel Blob is wired, generate signed URLs here
  // instead of passing raw public URLs. For now pass through DB values.
  photo10sUrl: string | null
  photo60sUrl: string | null
  completed: boolean
  createdAt: Date
  coinsEarned: number
  energyEarned: number
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const ChildIdSchema = z.object({ childId: z.string().min(1) })

const SubjectEnum = z.enum(['MATH', 'READING', 'ENGLISH', 'PE'])

const ListAttemptsSchema = z.object({
  childId: z.string().min(1),
  subject: SubjectEnum,
  take: z.number().int().min(1).max(200).default(50),
})

const ListPESessionsSchema = z.object({
  childId: z.string().min(1),
  take: z.number().int().min(1).max(200).default(50),
})

// ---------------------------------------------------------------------------
// listChildren
// ---------------------------------------------------------------------------

export async function listChildren(): Promise<ChildSummary[]> {
  const parent = await requireParent()

  const children = await prisma.child.findMany({
    where: { parentId: parent.id },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  // Fetch summaries in parallel.
  return Promise.all(children.map((c) => fetchSummary(c.id)))
}

// ---------------------------------------------------------------------------
// getChildDetail
// ---------------------------------------------------------------------------

export async function getChildDetail(input: { childId: string }): Promise<ChildDetail> {
  const parsed = ChildIdSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  const [summary, child] = await Promise.all([
    fetchSummary(parsed.data.childId),
    prisma.child.findUniqueOrThrow({
      where: { id: parsed.data.childId },
      select: { username: true, createdAt: true },
    }),
  ])

  return {
    ...summary,
    username: child.username,
    createdAt: child.createdAt,
  }
}

// ---------------------------------------------------------------------------
// listAttempts
// ---------------------------------------------------------------------------

export async function listAttempts(input: {
  childId: string
  subject: z.infer<typeof SubjectEnum>
  take?: number
}): Promise<TaskAttemptRecord[]> {
  const parsed = ListAttemptsSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  const rows = await prisma.taskAttempt.findMany({
    where: { childId: parsed.data.childId, subject: parsed.data.subject },
    orderBy: { createdAt: 'desc' },
    take: parsed.data.take,
    select: {
      id: true,
      subject: true,
      level: true,
      correctCount: true,
      totalCount: true,
      passed: true,
      coinsEarned: true,
      energyEarned: true,
      xpEarned: true,
      durationMs: true,
      createdAt: true,
    },
  })

  return rows
}

// ---------------------------------------------------------------------------
// listPESessions
// ---------------------------------------------------------------------------

export async function listPESessions(input: {
  childId: string
  take?: number
}): Promise<PESessionRecord[]> {
  const parsed = ListPESessionsSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  const rows = await prisma.pESession.findMany({
    where: { childId: parsed.data.childId },
    orderBy: { createdAt: 'desc' },
    take: parsed.data.take,
    select: {
      id: true,
      exerciseName: true,
      exerciseKey: true,
      photo10sUrl: true,
      photo60sUrl: true,
      completed: true,
      createdAt: true,
      coinsEarned: true,
      energyEarned: true,
    },
  })

  // TODO (Phase 5): replace raw URLs with short-lived signed URLs once
  // Vercel Blob private upload is configured.
  return rows
}

// ---------------------------------------------------------------------------
// deleteChild
// ---------------------------------------------------------------------------

export async function deleteChild(input: { childId: string }): Promise<{ ok: true }> {
  const parsed = ChildIdSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  // Prisma cascades delete all related rows (progress, attempts, sessions,
  // inventory, rooms, appearance) via onDelete: Cascade in the schema.
  await prisma.child.delete({ where: { id: parsed.data.childId } })

  return { ok: true }
}
