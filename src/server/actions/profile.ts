'use server'
// Profile actions: change password for PARENT or RELATIVE.
// Neither action returns sensitive data (hashes or plaintext passwords).

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParent, requireRelative } from '@/server/auth/guards'
import { verifyPassword, hashPassword } from '@/server/auth/password'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

// ---------------------------------------------------------------------------
// changeParentPassword
// ---------------------------------------------------------------------------

export async function changeParentPassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<{ ok: true }> {
  const parsed = ChangePasswordSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const parent = await requireParent()

  const row = await prisma.parent.findUniqueOrThrow({
    where: { id: parent.id },
    select: { passwordHash: true },
  })

  const valid = await verifyPassword(parsed.data.currentPassword, row.passwordHash)
  if (!valid) throw new Error('INVALID_PASSWORD')

  const newHash = await hashPassword(parsed.data.newPassword)
  await prisma.parent.update({
    where: { id: parent.id },
    data: { passwordHash: newHash },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// changeRelativePassword
// ---------------------------------------------------------------------------

export async function changeRelativePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<{ ok: true }> {
  const parsed = ChangePasswordSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const relative = await requireRelative()

  const row = await prisma.relative.findUniqueOrThrow({
    where: { id: relative.id },
    select: { passwordHash: true },
  })

  const valid = await verifyPassword(parsed.data.currentPassword, row.passwordHash)
  if (!valid) throw new Error('INVALID_PASSWORD')

  const newHash = await hashPassword(parsed.data.newPassword)
  await prisma.relative.update({
    where: { id: relative.id },
    data: { passwordHash: newHash },
  })

  return { ok: true }
}
