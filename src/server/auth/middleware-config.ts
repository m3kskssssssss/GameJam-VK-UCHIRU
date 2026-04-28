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

      // Active session + auth pages → redirect to the appropriate home
      if (pathname.startsWith('/auth/')) {
        if (auth?.user) {
          const home = auth.user.role === 'PARENT' ? '/parent' : '/play'
          return Response.redirect(new URL(home, request.url))
        }
        return true
      }

      // Parent-only area
      if (pathname.startsWith('/parent')) {
        return auth?.user?.role === 'PARENT'
      }

      // Child-only area
      if (pathname.startsWith('/play')) {
        return auth?.user?.role === 'CHILD'
      }

      return true
    },
  },
}

export const { auth: middlewareAuth } = NextAuth(middlewareConfig)
