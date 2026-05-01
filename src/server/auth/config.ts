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
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { role, identifier, password } = parsed.data

        if (role === 'parent') {
          const parent = await prisma.parent.findUnique({
            where: { email: identifier },
            select: { id: true, displayName: true, passwordHash: true, email: true },
          })
          if (!parent) return null

          const valid = await verifyPassword(password, parent.passwordHash)
          if (!valid) return null

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
          if (!child) return null

          const validChild = await verifyPassword(password, child.passwordHash)
          if (!validChild) return null

          return {
            id: child.id,
            name: child.displayName,
            email: child.username, // NextAuth requires email; use username as surrogate
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
        if (!relative) return null

        const validRelative = await verifyPassword(password, relative.passwordHash)
        if (!validRelative) return null

        return {
          id: relative.id,
          name: relative.displayName,
          email: relative.username, // surrogate, same pattern as CHILD
          role: 'RELATIVE' as const,
          parentId: relative.parentId,
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

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
})
