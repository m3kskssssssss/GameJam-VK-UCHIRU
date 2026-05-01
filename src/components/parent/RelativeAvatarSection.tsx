'use client'
// RelativeAvatarSection — wraps AvatarUploader for the relative profile page.
// The /api/avatar/upload route handles the DB write for RELATIVE self-update.
// We just need to refresh the router after upload to reflect the new avatar.
import { useRouter } from 'next/navigation'
import { AvatarUploader } from '@/components/parent/AvatarUploader'

interface RelativeAvatarSectionProps {
  initialUrl: string | null
  displayName: string
  relativeId: string
}

export function RelativeAvatarSection({
  initialUrl,
  displayName,
  relativeId,
}: RelativeAvatarSectionProps) {
  const router = useRouter()

  async function handleUploaded(_data: { url: string; key: string }) {
    // The /api/avatar/upload route already persisted the URL for RELATIVE self-update.
    // We just need to refresh to show the new avatar in the AppShell header.
    router.refresh()
  }

  return (
    <AvatarUploader
      initialUrl={initialUrl}
      fallbackInitials={displayName}
      target="relative"
      targetId={relativeId}
      onUploaded={handleUploaded}
    />
  )
}
