import { z } from 'zod'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

export const registerParentSchema = z.object({
  email: z.string().email(t.errors.emailInvalid),
  displayName: z
    .string()
    .min(2, t.errors.displayNameTooShort)
    .max(50, t.errors.displayNameTooLong),
  password: z.string().min(6, t.errors.passwordTooShort),
})

export const loginParentSchema = z.object({
  email: z.string().email(t.errors.emailInvalid),
  password: z.string().min(1, t.errors.passwordRequired),
})

export const loginChildSchema = z.object({
  username: z.string().min(1, t.errors.usernameRequired),
  password: z.string().min(1, t.errors.passwordRequired),
})

export const createChildSchema = z.object({
  username: z
    .string()
    .min(3, t.errors.usernameTooShort)
    .max(20, t.errors.usernameTooLong)
    .regex(/^[a-z0-9_]+$/, t.errors.usernameInvalid),
  displayName: z
    .string()
    .min(2, t.errors.displayNameTooShort)
    .max(50, t.errors.displayNameTooLong),
  password: z.string().min(6, t.errors.passwordTooShort),
  gender: z.enum(['BOY', 'GIRL']).default('BOY'),
})
