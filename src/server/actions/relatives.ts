'use server'
// Parent-side relative management: create, list, delete, reset password.
// Relatives are family members (e.g. grandparents) who get a RELATIVE JWT
// and can view the activity feed but cannot manage children.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent } from '@/server/auth/guards'
import { hashPassword } from '@/server/auth/password'
import { deleteBlob } from '@/lib/blob'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const UsernameField = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, digits, _ and -')

const CreateRelativeSchema = z.object({
  username: UsernameField,
  displayName: z.string().trim().min(1).max(64),
  password: z.string().min(6),
})

const RelativeIdSchema = z.object({
  id: z.string().min(1),
})

const ResetRelativePasswordSchema = z.object({
  id: z.string().min(1),
  newPassword: z.string().min(6),
})

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type RelativeListItem = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  createdAt: Date
}

// ---------------------------------------------------------------------------
// listRelatives
// ---------------------------------------------------------------------------

export async function listRelatives(): Promise<RelativeListItem[]> {
  const parent = await requireParent()

  const rows = await prisma.relative.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  return rows
}

// ---------------------------------------------------------------------------
// createRelative
// ---------------------------------------------------------------------------

export async function createRelative(input: {
  username: string
  displayName: string
  password: string
}): Promise<{ id: string }> {
  const parsed = CreateRelativeSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  const { username, displayName, password } = parsed.data

  const passwordHash = await hashPassword(password)

  try {
    const relative = await prisma.relative.create({
      data: {
        username,
        displayName,
        passwordHash,
        parentId: parent.id,
      },
      select: { id: true },
    })
    return { id: relative.id }
  } catch (err) {
    // P2002 = unique constraint violation on username.
    const code = (err as { code?: string }).code
    if (code === 'P2002') throw new Error('USERNAME_TAKEN')
    throw err
  }
}

// ---------------------------------------------------------------------------
// deleteRelative
// ---------------------------------------------------------------------------

export async function deleteRelative(input: { id: string }): Promise<{ ok: true }> {
  const parsed = RelativeIdSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()

  const relative = await prisma.relative.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, parentId: true, avatarUrl: true },
  })

  if (!relative) throw new Error('NOT_FOUND')
  if (relative.parentId !== parent.id) throw new Error('ACCESS_DENIED')

  // Silently clean up avatar blob before deleting the record.
  if (relative.avatarUrl) {
    deleteBlob(relative.avatarUrl).catch((err) => {
      console.error('[relatives] deleteBlob avatar failed:', err)
    })
  }

  // FeedComment/Like rows with authorId === relative.id remain — the authorName
  // snapshot in FeedComment already preserves the display name, so no orphan issues.
  await prisma.relative.delete({ where: { id: parsed.data.id } })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// resetRelativePassword
// ---------------------------------------------------------------------------

export async function resetRelativePassword(input: {
  id: string
  newPassword: string
}): Promise<{ ok: true }> {
  const parsed = ResetRelativePasswordSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()

  const relative = await prisma.relative.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, parentId: true },
  })

  if (!relative) throw new Error('NOT_FOUND')
  if (relative.parentId !== parent.id) throw new Error('ACCESS_DENIED')

  const passwordHash = await hashPassword(parsed.data.newPassword)

  await prisma.relative.update({
    where: { id: parsed.data.id },
    data: { passwordHash },
  })

  return { ok: true }
}
