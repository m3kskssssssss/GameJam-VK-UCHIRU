// Route guard middleware using NextAuth v5.
// Uses a lightweight config (no Prisma/bcrypt) to stay Edge-compatible.
// - /parent/* requires PARENT role.
// - /play/*   requires CHILD role.
// - /auth/*   with an active session redirects to the user's home.
export { middlewareAuth as default } from '@/server/auth/middleware-config'

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth).*)',
  ],
}
