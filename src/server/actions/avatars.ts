'use server'
// Avatar management: parent, child and relative profile photo updates.
// Actual upload happens in /api/avatar/upload (E.11).
// These actions receive already-uploaded url/key and write them to the DB,
// deleting the old blob first if one exists.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent, assertOwnsChild } from '@/server/auth/guards'
import { deleteBlob } from '@/lib/blob'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const AvatarPayloadSchema = z.object({
  photoUrl: z.string().url(),
  photoKey: z.string().min(1).max(512),
})

const ChildAvatarSchema = AvatarPayloadSchema.extend({
  childId: z.string().min(1),
})

const RelativeAvatarSchema = AvatarPayloadSchema.extend({
  relativeId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// setParentAvatar
// ---------------------------------------------------------------------------

export async function setParentAvatar(input: {
  photoUrl: string
  photoKey: string
}): Promise<{ ok: true }> {
  const parsed = AvatarPayloadSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()

  const existing = await prisma.parent.findUnique({
    where: { id: parent.id },
    select: { avatarUrl: true },
  })

  // Silently remove previous avatar blob before storing the new one.
  if (existing?.avatarUrl) {
    deleteBlob(existing.avatarUrl).catch((err) => {
      console.error('[avatars] deleteBlob parent old avatar failed:', err)
    })
  }

  await prisma.parent.update({
    where: { id: parent.id },
    data: { avatarUrl: parsed.data.photoUrl, avatarKey: parsed.data.photoKey },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// setChildAvatar
// ---------------------------------------------------------------------------

export async function setChildAvatar(input: {
  childId: string
  photoUrl: string
  photoKey: string
}): Promise<{ ok: true }> {
  const parsed = ChildAvatarSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()
  await assertOwnsChild(parent.id, parsed.data.childId)

  const existing = await prisma.child.findUnique({
    where: { id: parsed.data.childId },
    select: { avatarUrl: true },
  })

  if (existing?.avatarUrl) {
    deleteBlob(existing.avatarUrl).catch((err) => {
      console.error('[avatars] deleteBlob child old avatar failed:', err)
    })
  }

  await prisma.child.update({
    where: { id: parsed.data.childId },
    data: { avatarUrl: parsed.data.photoUrl, avatarKey: parsed.data.photoKey },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// setRelativeAvatar
// ---------------------------------------------------------------------------

export async function setRelativeAvatar(input: {
  relativeId: string
  photoUrl: string
  photoKey: string
}): Promise<{ ok: true }> {
  const parsed = RelativeAvatarSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()

  const relative = await prisma.relative.findUnique({
    where: { id: parsed.data.relativeId },
    select: { parentId: true, avatarUrl: true },
  })

  if (!relative) throw new Error('NOT_FOUND')
  if (relative.parentId !== parent.id) throw new Error('ACCESS_DENIED')

  if (relative.avatarUrl) {
    deleteBlob(relative.avatarUrl).catch((err) => {
      console.error('[avatars] deleteBlob relative old avatar failed:', err)
    })
  }

  await prisma.relative.update({
    where: { id: parsed.data.relativeId },
    data: { avatarUrl: parsed.data.photoUrl, avatarKey: parsed.data.photoKey },
  })

  return { ok: true }
}
