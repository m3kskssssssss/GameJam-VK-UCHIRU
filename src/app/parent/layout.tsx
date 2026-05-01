// Parent area layout — enforces PARENT or RELATIVE session; wraps pages in AppShell.
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth/config'
import { prisma } from '@/lib/db'
import { AppShell } from '@/components/parent/AppShell'
import { Toaster } from '@/components/ui/sonner'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  const role = session.user.role

  let viewerKind: 'parent' | 'relative'
  let viewerName: string
  let viewerAvatarUrl: string | null = null

  if (role === 'PARENT') {
    viewerKind = 'parent'
    const parent = await prisma.parent.findUnique({
      where: { id: session.user.id },
      select: { displayName: true, avatarUrl: true },
    })
    viewerName = parent?.displayName ?? session.user.name ?? ''
    viewerAvatarUrl = parent?.avatarUrl ?? null
  } else if (role === 'RELATIVE') {
    viewerKind = 'relative'
    const relative = await prisma.relative.findUnique({
      where: { id: session.user.id },
      select: { displayName: true, avatarUrl: true },
    })
    viewerName = relative?.displayName ?? session.user.name ?? ''
    viewerAvatarUrl = relative?.avatarUrl ?? null
  } else {
    redirect('/auth/login')
  }

  return (
    <>
      <AppShell
        viewerKind={viewerKind}
        viewerName={viewerName}
        viewerAvatarUrl={viewerAvatarUrl}
      >
        {children}
      </AppShell>
      <Toaster />
    </>
  )
}
