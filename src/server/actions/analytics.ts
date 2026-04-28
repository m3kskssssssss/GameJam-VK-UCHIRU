'use server'
// XP aggregation helpers for the parent dashboard.
// Computes per-day XP totals from TaskAttempt rows (academic subjects)
// and PESession rows (20 XP each, per GAME_DESIGN.md).

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent, assertOwnsChild } from '@/server/auth/guards'

// XP awarded per completed PE session (GAME_DESIGN.md).
const PE_SESSION_XP = 20

const GetXpSeriesSchema = z.object({
  childId: z.string().min(1),
  days: z.number().int().min(1).max(90).default(14),
})

export type XpDataPoint = {
  /** Date formatted as DD.MM for display (e.g. "28.04"). */
  date: string
  /** ISO date string YYYY-MM-DD — used as recharts key. */
  isoDate: string
  xp: number
}

/**
 * Returns per-day XP totals for the last `days` days (defaults to 14).
 * Academic XP comes from TaskAttempt.xpEarned (subjects MATH/READING/ENGLISH).
 * PE XP is flat 20 XP per completed PESession.
 * Missing days are filled with 0.
 */
export async function getXpSeries(input: {
  childId: string
  days?: number
}): Promise<XpDataPoint[]> {
  const parsed = GetXpSeriesSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  const { childId, days } = parsed.data

  // Compute the window start: beginning of (today - (days-1)) in UTC.
  const now = new Date()
  const windowStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - (days - 1),
      0,
      0,
      0,
      0,
    ),
  )

  // Fetch academic attempts and completed PE sessions in parallel.
  const [attempts, peSessions] = await Promise.all([
    prisma.taskAttempt.findMany({
      where: {
        childId,
        subject: { in: ['MATH', 'READING', 'ENGLISH'] },
        createdAt: { gte: windowStart },
      },
      select: { xpEarned: true, createdAt: true },
    }),
    prisma.pESession.findMany({
      where: {
        childId,
        completed: true,
        createdAt: { gte: windowStart },
      },
      select: { createdAt: true },
    }),
  ])

  // Build a map from ISO date string to XP total.
  const xpByDay = new Map<string, number>()

  for (const attempt of attempts) {
    const key = toIsoDate(attempt.createdAt)
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + attempt.xpEarned)
  }

  for (const session of peSessions) {
    const key = toIsoDate(session.createdAt)
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + PE_SESSION_XP)
  }

  // Build the full series with all days in the window, filling gaps with 0.
  const series: XpDataPoint[] = []
  for (let i = 0; i < days; i++) {
    const dayDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - (days - 1 - i),
      ),
    )
    const isoDate = toIsoDate(dayDate)
    const dd = String(dayDate.getUTCDate()).padStart(2, '0')
    const mm = String(dayDate.getUTCMonth() + 1).padStart(2, '0')
    series.push({
      date: `${dd}.${mm}`,
      isoDate,
      xp: xpByDay.get(isoDate) ?? 0,
    })
  }

  return series
}

/** Formats a Date as YYYY-MM-DD in UTC. */
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
