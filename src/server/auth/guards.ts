// Server-side session guards. Call these at the top of server actions and RSC layouts.
// They throw or redirect on failure — never return partial data.
import { redirect } from 'next/navigation'
import { auth } from './config'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParentSession {
  id: string
  displayName: string
  email: string | null
}

export interface ChildSession {
  id: string
  displayName: string
  parentId: string
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Require a valid PARENT session. Redirects to /auth/login otherwise.
 * Returns lightweight parent info from the session (no DB call).
 */
export async function requireParent(): Promise<ParentSession> {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') {
    redirect('/auth/login')
  }
  return {
    id: session.user.id,
    displayName: session.user.name ?? '',
    email: session.user.email ?? null,
  }
}

/**
 * Require a valid CHILD session. Redirects to /auth/login otherwise.
 * Returns lightweight child info from the session (no DB call).
 */
export async function requireChild(): Promise<ChildSession> {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') {
    redirect('/auth/login')
  }
  return {
    id: session.user.id,
    displayName: session.user.name ?? '',
    parentId: session.user.parentId ?? '',
  }
}

/**
 * Assert that the currently authenticated parent owns the given child.
 * Must be called after requireParent().
 * Throws an Error if ownership check fails so the caller can surface a 403.
 */
export async function assertOwnsChild(
  parentId: string,
  childId: string,
): Promise<void> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  })
  if (!child || child.parentId !== parentId) {
    throw new Error('ACCESS_DENIED')
  }
}
