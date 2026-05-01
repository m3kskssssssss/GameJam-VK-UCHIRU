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

export interface RelativeSession {
  id: string
  displayName: string
  parentId: string
}

export type ViewerKind = 'parent' | 'relative'

export interface FeedViewer {
  kind: ViewerKind
  id: string
  /** For PARENT — own id (they are their own parent context). For RELATIVE — id of the owning parent. */
  parentId: string
  displayName: string
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

/**
 * Require a valid RELATIVE session. Redirects to /auth/login otherwise.
 * Returns lightweight relative info from the session (no DB call).
 */
export async function requireRelative(): Promise<RelativeSession> {
  const session = await auth()
  if (!session || session.user.role !== 'RELATIVE') {
    redirect('/auth/login')
  }
  return {
    id: session.user.id,
    displayName: session.user.name ?? '',
    parentId: session.user.parentId ?? '',
  }
}

/**
 * Require either a PARENT or RELATIVE session.
 * Used for shared views such as the activity feed.
 * Redirects to /auth/login for any other role or unauthenticated visitors.
 *
 * For PARENT: parentId is set to the parent's own id.
 * For RELATIVE: parentId is set to the owning parent's id from the session.
 */
export async function requireParentOrRelative(): Promise<FeedViewer> {
  const session = await auth()
  const role = session?.user?.role

  if (role === 'PARENT') {
    return {
      kind: 'parent',
      id: session!.user.id,
      parentId: session!.user.id,
      displayName: session!.user.name ?? '',
    }
  }

  if (role === 'RELATIVE') {
    return {
      kind: 'relative',
      id: session!.user.id,
      parentId: session!.user.parentId ?? '',
      displayName: session!.user.name ?? '',
    }
  }

  redirect('/auth/login')
}
