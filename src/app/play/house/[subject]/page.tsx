// Phase 5.2 — Mini-game house entry point (server component).
// Validates the route subject param, loads SubjectProgress from DB,
// and renders the appropriate client-side mini-game component.
// Mini-game components are stubs until tasks 5.4-5.7 replace them.

import { redirect } from 'next/navigation'
import { requireChild } from '@/server/auth/guards'
import { prisma } from '@/lib/db'
import { MathGame } from '@/components/minigames/math/MathGame'
import { ReadingGame } from '@/components/minigames/reading/ReadingGame'
import { EnglishGame } from '@/components/minigames/english/EnglishGame'
import { PEGame } from '@/components/minigames/pe/PEGame'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DbSubject = 'MATH' | 'READING' | 'ENGLISH' | 'PE'

const VALID_SUBJECTS = ['math', 'reading', 'english', 'pe'] as const
type RouteSubject = (typeof VALID_SUBJECTS)[number]

const SUBJECT_MAP: Record<RouteSubject, DbSubject> = {
  math: 'MATH',
  reading: 'READING',
  english: 'ENGLISH',
  pe: 'PE',
}

function isValidSubject(s: string): s is RouteSubject {
  return (VALID_SUBJECTS as readonly string[]).includes(s)
}

// ---------------------------------------------------------------------------
// Default progress when no row exists yet
// ---------------------------------------------------------------------------

const DEFAULT_PROGRESS = { level: 1, completedLevels: 0, totalXp: 0 }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HousePage({
  params,
}: {
  params: Promise<{ subject: string }>
}) {
  const { subject } = await params

  if (!isValidSubject(subject)) {
    redirect('/play')
  }

  const dbSubject: DbSubject = SUBJECT_MAP[subject]
  const child = await requireChild()

  // Fetch SubjectProgress (may not exist for brand-new children).
  const progressRow = await prisma.subjectProgress.findUnique({
    where: { childId_subject: { childId: child.id, subject: dbSubject } },
    select: { level: true, completedLevels: true, totalXp: true },
  })

  const progress = progressRow ?? DEFAULT_PROGRESS

  // For PE we also need the count of completed sessions.
  let peSessionsCount = 0
  if (dbSubject === 'PE') {
    peSessionsCount = await prisma.pESession.count({
      where: { childId: child.id, completed: true },
    })
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {dbSubject === 'MATH' && (
        <MathGame
          initialLevel={progress.level}
          completedLevels={progress.completedLevels}
        />
      )}
      {dbSubject === 'READING' && (
        <ReadingGame
          initialLevel={progress.level}
          completedLevels={progress.completedLevels}
        />
      )}
      {dbSubject === 'ENGLISH' && (
        <EnglishGame
          initialLevel={progress.level}
          completedLevels={progress.completedLevels}
        />
      )}
      {dbSubject === 'PE' && <PEGame peSessionsCount={peSessionsCount} />}
    </div>
  )
}
