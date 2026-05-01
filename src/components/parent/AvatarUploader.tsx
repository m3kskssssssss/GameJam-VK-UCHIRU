'use client'
// AvatarUploader — reusable avatar photo upload widget.
// Builds FormData with the right fields for /api/avatar/upload,
// then calls onUploaded so the caller can persist url/key via a server action.
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AvatarUploaderProps {
  initialUrl: string | null
  fallbackInitials: string
  onUploaded: (data: { url: string; key: string }) => Promise<void>
  target: 'parent' | 'child' | 'relative'
  /** Required when target is 'child' or 'relative'. */
  targetId?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AvatarUploader({
  initialUrl,
  fallbackInitials,
  onUploaded,
  target,
  targetId,
}: AvatarUploaderProps) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build the target string expected by /api/avatar/upload
  // Format: 'parent' | 'child:<id>' | 'relative:<id>'
  function buildTargetString(): string {
    if (target === 'parent') return 'parent'
    if (!targetId) throw new Error('targetId required for child/relative')
    return `${target}:${targetId}`
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('target', buildTargetString())

      const res = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error ?? 'UPLOAD_FAILED')
      }

      const json = (await res.json()) as { url: string; key: string }
      setCurrentUrl(json.url)
      await onUploaded({ url: json.url, key: json.key })
      toast.success(p.avatar.uploadSuccess)
    } catch (err) {
      console.error('[AvatarUploader] upload error', err)
      toast.error(p.avatar.uploadError)
    } finally {
      setIsUploading(false)
      // Reset the input so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-20 w-20">
        {currentUrl && <AvatarImage src={currentUrl} alt={fallbackInitials} />}
        <AvatarFallback className="bg-primary text-primary-foreground font-extrabold text-xl">
          {initials(fallbackInitials)}
        </AvatarFallback>
      </Avatar>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden="true"
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? p.avatar.uploading : p.avatar.btnChange}
      </Button>
    </div>
  )
}
