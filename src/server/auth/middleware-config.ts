// Lightweight NextAuth config for middleware — NO Prisma, NO bcrypt.
// This is intentional: middleware runs in the Edge Runtime and heavy Node.js
// dependencies (Prisma, bcryptjs) cannot be bundled there.
// Session validation happens via the JWT cookie alone.
import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'

const middlewareConfig: NextAuthConfig = {
  providers: [], // Credentials provider is added only in the full config
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const role = auth?.user?.role

      // Active session + auth pages → redirect to the appropriate home
      if (pathname.startsWith('/auth/')) {
        if (auth?.user) {
          if (role === 'PARENT') {
            return NextResponse.redirect(new URL('/parent', request.url))
          }
          if (role === 'CHILD') {
            return NextResponse.redirect(new URL('/play', request.url))
          }
          if (role === 'RELATIVE') {
            return NextResponse.redirect(new URL('/parent/feed', request.url))
          }
          // If role is temporarily unavailable in middleware session shape,
          // do not force-redirect and avoid redirect loops.
          return true
        }
        return true
      }

      // Parent-only area
      if (pathname.startsWith('/parent')) {
        if (!auth?.user) return false

        // PARENT: full access
        if (role === 'PARENT') return true

        // RELATIVE: only /parent/feed and /parent/profile (and their sub-paths)
        if (role === 'RELATIVE') {
          const isFeed =
            pathname === '/parent/feed' || pathname.startsWith('/parent/feed/')
          const isProfile =
            pathname === '/parent/profile' ||
            pathname.startsWith('/parent/profile/')
          if (isFeed || isProfile) return true
          return NextResponse.redirect(new URL('/parent/feed', request.url))
        }

        // CHILD or any other role: deny → next-auth sends to /auth/login
        return false
      }

      // Child-only area
      if (pathname.startsWith('/play')) {
        if (!auth?.user) return false
        return role ? role === 'CHILD' : true
      }

      return true
    },
  },
}

export const { auth: middlewareAuth } = NextAuth(middlewareConfig)