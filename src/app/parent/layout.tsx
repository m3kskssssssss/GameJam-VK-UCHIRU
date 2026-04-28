// Parent area layout — enforces PARENT session server-side
import { requireParent } from '@/server/auth/guards'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This call redirects to /auth/login if the session is missing or wrong role.
  await requireParent()
  return <>{children}</>
}
