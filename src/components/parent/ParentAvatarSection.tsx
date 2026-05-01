'use client'
// ParentAvatarSection — wraps AvatarUploader for the parent profile page.
// Calls setParentAvatar after upload and refreshes the router.
import { useRouter } from 'next/navigation'
import { AvatarUploader } from '@/components/parent/AvatarUploader'
import { setParentAvatar } from '@/server/actions/avatars'

interface ParentAvatarSectionProps {
  initialUrl: string | null
  displayName: string
}

export function ParentAvatarSection({
  initialUrl,
  displayName,
}: ParentAvatarSectionProps) {
  const router = useRouter()

  async function handleUploaded(data: { url: string; key: string }) {
    await setParentAvatar({ photoUrl: data.url, photoKey: data.key })
    router.refresh()
  }

  return (
    <AvatarUploader
      initialUrl={initialUrl}
      fallbackInitials={displayName}
      target="parent"
      onUploaded={handleUploaded}
    />
  )
}
