// Lightweight NextAuth config for middleware — NO Prisma, NO bcrypt.
// This is intentional: middleware runs in the Edge Runtime and heavy Node.js
// dependencies (Prisma, bcryptjs) cannot be bundled there.
// Session validation happens via the JWT cookie alone.
import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'

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
            return Response.redirect(new URL('/parent', request.url))
          }
          if (role === 'CHILD') {
            return Response.redirect(new URL('/play', request.url))
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
        return role ? role === 'PARENT' : true
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
