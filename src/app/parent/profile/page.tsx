// Profile page — accessible by both PARENT and RELATIVE.
// Shows avatar uploader, display name (read-only), and password change form.
import { redirect } from 'next/navigation'
import { auth } from '@/server/auth/config'
import { prisma } from '@/lib/db'
import { Separator } from '@/components/ui/separator'
import { ParentAvatarSection } from '@/components/parent/ParentAvatarSection'
import { RelativeAvatarSection } from '@/components/parent/RelativeAvatarSection'
import { ChangePasswordForm } from '@/components/parent/ChangePasswordForm'
import { ru } from '@/i18n/ru'

const { parent: p, auth: at } = ru
const prof = p.profile

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const role = session.user.role

  if (role === 'PARENT') {
    const parent = await prisma.parent.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { displayName: true, email: true, avatarUrl: true },
    })

    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-extrabold">{prof.title}</h1>

        {/* Avatar */}
        <section className="flex justify-center">
          <ParentAvatarSection
            initialUrl={parent.avatarUrl}
            displayName={parent.displayName}
          />
        </section>

        <Separator />

        {/* Display name + email (read-only) */}
        <section className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              {prof.labelDisplayName}
            </p>
            <p className="font-semibold">{parent.displayName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              {prof.labelEmail}
            </p>
            <p className="font-semibold">{parent.email}</p>
          </div>
        </section>

        <Separator />

        {/* Password change */}
        <section className="space-y-4">
          <h2 className="text-base font-bold">{prof.changePasswordTitle}</h2>
          <ChangePasswordForm role="parent" />
        </section>
      </div>
    )
  }

  if (role === 'RELATIVE') {
    const relative = await prisma.relative.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { displayName: true, username: true, avatarUrl: true },
    })

    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-extrabold">{prof.title}</h1>

        {/* Avatar */}
        <section className="flex justify-center">
          <RelativeAvatarSection
            initialUrl={relative.avatarUrl}
            displayName={relative.displayName}
            relativeId={session.user.id}
          />
        </section>

        <Separator />

        {/* Display name + username (read-only) */}
        <section className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              {prof.labelDisplayName}
            </p>
            <p className="font-semibold">{relative.displayName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              {at.labelUsername}
            </p>
            <p className="font-semibold">@{relative.username}</p>
          </div>
        </section>

        <Separator />

        {/* Password change */}
        <section className="space-y-4">
          <h2 className="text-base font-bold">{prof.changePasswordTitle}</h2>
          <ChangePasswordForm role="relative" />
        </section>
      </div>
    )
  }

  redirect('/auth/login')
}
