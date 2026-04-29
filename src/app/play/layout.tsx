// Play area layout — enforces CHILD session server-side and locks orientation.
import { requireChild } from '@/server/auth/guards'
import { OrientationGate } from '@/components/play/OrientationGate'

export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireChild()
  return <OrientationGate>{children}</OrientationGate>
}
