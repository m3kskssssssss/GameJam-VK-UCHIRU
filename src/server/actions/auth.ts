'use server'
// Auth server actions: register, login, child creation.
// All inputs are validated with Zod before touching the DB.
// Passwords are hashed; hashes are never returned.

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  createChildSchema,
  loginChildSchema,
  loginParentSchema,
  registerParentSchema,
} from '@/lib/validation/auth'
import { hashPassword } from '@/server/auth/password'
import { signIn } from '@/server/auth/index'
import { requireParent } from '@/server/auth/guards'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

// ---------------------------------------------------------------------------
// Action result type
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// registerParent
// ---------------------------------------------------------------------------

export async function registerParent(
  input: z.infer<typeof registerParentSchema>,
): Promise<ActionResult> {
  const parsed = registerParentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? t.errors.validationFailed }
  }

  const { email, displayName, password } = parsed.data

  try {
    const existing = await prisma.parent.findUnique({ where: { email } })
    if (existing) {
      return { ok: false, error: t.errors.emailTaken }
    }

    const passwordHash = await hashPassword(password)
    await prisma.parent.create({
      data: { email, displayName, passwordHash },
    })

    // Auto sign-in after registration
    await signIn('credentials', {
      role: 'parent',
      identifier: email,
      password,
      redirect: false,
    })
  } catch {
    return { ok: false, error: t.errors.unexpected }
  }

  redirect('/parent')
}

// ---------------------------------------------------------------------------
// loginAction
// ---------------------------------------------------------------------------

export async function loginAction(input: {
  role: 'parent' | 'child'
  identifier: string
  password: string
}): Promise<ActionResult> {
  const { role, identifier, password } = input

  try {
    await signIn('credentials', {
      role,
      identifier,
      password,
      redirect: false,
    })
  } catch {
    return { ok: false, error: t.errors.invalidCredentials }
  }

  redirect(role === 'parent' ? '/parent' : '/play')
}

// ---------------------------------------------------------------------------
// createChild  (requires PARENT session)
// ---------------------------------------------------------------------------

export async function createChild(
  input: z.infer<typeof createChildSchema>,
): Promise<ActionResult<{ childId: string }>> {
  const parent = await requireParent()

  const parsed = createChildSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? t.errors.validationFailed }
  }

  const { username, displayName, password } = parsed.data

  const existing = await prisma.child.findUnique({ where: { username } })
  if (existing) {
    return { ok: false, error: t.errors.usernameTaken }
  }

  const passwordHash = await hashPassword(password)

  const child = await prisma.child.create({
    data: {
      username,
      displayName,
      passwordHash,
      parentId: parent.id,
    },
    select: { id: true },
  })

  return { ok: true, data: { childId: child.id } }
}

// ---------------------------------------------------------------------------
// resetChildPassword (requires PARENT session + ownership)
// ---------------------------------------------------------------------------

export async function resetChildPassword(input: {
  childId: string
  newPassword: string
}): Promise<ActionResult> {
  const parent = await requireParent()

  const { childId, newPassword } = input
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: t.errors.passwordTooShort }
  }

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  })
  if (!child || child.parentId !== parent.id) {
    return { ok: false, error: t.errors.accessDenied }
  }

  const passwordHash = await hashPassword(newPassword)
  await prisma.child.update({
    where: { id: childId },
    data: { passwordHash },
  })

  return { ok: true, data: undefined }
}
