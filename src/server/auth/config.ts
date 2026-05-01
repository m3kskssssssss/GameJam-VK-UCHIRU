// NextAuth v5 configuration — Credentials provider with parent/child branching
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import type { JWT } from 'next-auth/jwt'
import { prisma } from '@/lib/db'
import { verifyPassword } from './password'

// ---------------------------------------------------------------------------
// Input schema for the Credentials provider
// ---------------------------------------------------------------------------

const credentialsSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('parent'),
    identifier: z.string().email(),
    password: z.string().min(1),
  }),
  z.object({
    role: z.literal('child'),
    identifier: z.string().min(1),
    password: z.string().min(1),
  }),
  z.object({
    role: z.literal('relative'),
    identifier: z.string().min(1),
    password: z.string().min(1),
  }),
])

// ---------------------------------------------------------------------------
// NextAuth config
// ---------------------------------------------------------------------------

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        role: { label: 'Role', type: 'text' },
        identifier: { label: 'Identifier', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const rawRole =
          typeof credentials?.role === 'string' ? credentials.role : 'unknown'
        const rawId =
          typeof credentials?.identifier === 'string'
            ? credentials.identifier
            : ''

        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          console.warn('[auth.authorize] zod validation failed', {
            role: rawRole,
            identifierLength: rawId.length,
            issues: parsed.error.issues.map((i) => ({
              path: i.path.join('.'),
              code: i.code,
            })),
          })
          return null
        }

        const { role, identifier, password } = parsed.data

        try {
          if (role === 'parent') {
            const parent = await prisma.parent.findUnique({
              where: { email: identifier },
              select: { id: true, displayName: true, passwordHash: true, email: true },
            })
            if (!parent) {
              console.warn('[auth.authorize] parent not found', { email: identifier })
              return null
            }

            const valid = await verifyPassword(password, parent.passwordHash)
            if (!valid) {
              console.warn('[auth.authorize] parent password mismatch', {
                parentId: parent.id,
              })
              return null
            }

            return {
              id: parent.id,
              name: parent.displayName,
              email: parent.email,
              role: 'PARENT' as const,
            }
          }

          if (role === 'child') {
            const child = await prisma.child.findUnique({
              where: { username: identifier },
              select: {
                id: true,
                displayName: true,
                passwordHash: true,
                parentId: true,
                username: true,
              },
            })
            if (!child) {
              console.warn('[auth.authorize] child not found', { username: identifier })
              return null
            }

            const validChild = await verifyPassword(password, child.passwordHash)
            if (!validChild) {
              console.warn('[auth.authorize] child password mismatch', {
                childId: child.id,
              })
              return null
            }

            return {
              id: child.id,
              name: child.displayName,
              email: child.username,
              role: 'CHILD' as const,
              parentId: child.parentId,
            }
          }

          // role === 'relative'
          const relative = await prisma.relative.findUnique({
            where: { username: identifier },
            select: {
              id: true,
              displayName: true,
              passwordHash: true,
              parentId: true,
              username: true,
            },
          })
          if (!relative) {
            console.warn('[auth.authorize] relative not found', {
              username: identifier,
            })
            return null
          }

          const validRelative = await verifyPassword(password, relative.passwordHash)
          if (!validRelative) {
            console.warn('[auth.authorize] relative password mismatch', {
              relativeId: relative.id,
            })
            return null
          }

          return {
            id: relative.id,
            name: relative.displayName,
            email: relative.username,
            role: 'RELATIVE' as const,
            parentId: relative.parentId,
          }
        } catch (err) {
          console.error('[auth.authorize] DB error', {
            role,
            error: err instanceof Error
              ? { name: err.name, message: err.message }
              : String(err),
          })
          return null
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/login',
  },

  callbacks: {
    jwt({ token, user }) {
      // On sign-in `user` is present; on subsequent requests only `token` is.
      if (user) {
        token.id = user.id
        token.role = user.role
        if (user.parentId) {
          token.parentId = user.parentId
        }
      }
      return token
    },

    session({ session, token }) {
      // token is typed as `JWT` via augmentation in src/types/next-auth.d.ts
      const jwt = token as JWT
      session.user.id = jwt.id
      session.user.role = jwt.role
      if (jwt.parentId) {
        session.user.parentId = jwt.parentId
      }
      return session
    },
  },
})
