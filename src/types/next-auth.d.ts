// Augment NextAuth v5 types to include our custom session/token fields.
// No `any` — every field is explicitly typed.
// JWT augmentation uses the module that next-auth re-exports from @auth/core/jwt.

import type { DefaultSession } from 'next-auth'

type UserRole = 'PARENT' | 'CHILD' | 'RELATIVE'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      /** Present for CHILD and RELATIVE sessions */
      parentId?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: UserRole
    /** Present for CHILD and RELATIVE sessions */
    parentId?: string
  }
}

// next-auth/jwt re-exports from @auth/core/jwt, so augmenting this module
// is the correct approach for NextAuth v5.
declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    /** Present for CHILD and RELATIVE sessions */
    parentId?: string
  }
}
