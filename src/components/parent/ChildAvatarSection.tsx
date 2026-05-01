'use client'
// ChildAvatarSection — wraps AvatarUploader for the child detail page.
// Calls setChildAvatar after a successful upload then refreshes the router.
import { useRouter } from 'next/navigation'
import { AvatarUploader } from '@/components/parent/AvatarUploader'
import { setChildAvatar } from '@/server/actions/avatars'

interface ChildAvatarSectionProps {
  childId: string
  initialUrl: string | null
  displayName: string
}

export function ChildAvatarSection({
  childId,
  initialUrl,
  displayName,
}: ChildAvatarSectionProps) {
  const router = useRouter()

  async function handleUploaded(data: { url: string; key: string }) {
    await setChildAvatar({ childId, photoUrl: data.url, photoKey: data.key })
    router.refresh()
  }

  return (
    <AvatarUploader
      initialUrl={initialUrl}
      fallbackInitials={displayName}
      target="child"
      targetId={childId}
      onUploaded={handleUploaded}
    />
  )
}
