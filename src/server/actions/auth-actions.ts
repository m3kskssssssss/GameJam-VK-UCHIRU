'use server'
// Server-action wrappers for NextAuth functions that must be invoked from
// client components. NextAuth v5 ships server-side helpers that depend on
// request scope (cookies/headers); calling them directly from a 'use client'
// module raises a client-side exception in production.

import { signOut } from '@/server/auth/index'

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' })
}
