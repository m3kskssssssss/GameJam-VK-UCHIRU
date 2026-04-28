// Play area layout — enforces CHILD session server-side
import { requireChild } from '@/server/auth/guards'

export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirects to /auth/login if session is missing or wrong role.
  await requireChild()
  return <>{children}</>
}
