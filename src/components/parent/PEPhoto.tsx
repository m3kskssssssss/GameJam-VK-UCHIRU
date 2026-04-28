// PEPhoto — renders a single PE session photo slot.
// Shows a placeholder when the signed URL is null (Phase 5 will fill real URLs).
import Image from 'next/image'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

interface PEPhotoProps {
  /** Human-readable slot label, e.g. "Фото (10 сек)". */
  label: string
  /** Signed URL or null when the photo is not yet available. */
  signedUrl: string | null
}

export function PEPhoto({ label, signedUrl }: PEPhotoProps) {
  return (
    <figure className="flex flex-col gap-1 flex-1 min-w-0">
      <figcaption className="text-xs text-muted-foreground font-medium truncate">
        {label}
      </figcaption>

      {signedUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={signedUrl}
            alt={label}
            fill
            sizes="(max-width: 640px) 50vw, 300px"
            className="object-cover"
            unoptimized // signed URLs may not be optimisable via Next.js image CDN
          />
        </div>
      ) : (
        <div
          role="img"
          aria-label={p.photoMissing}
          className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground"
        >
          {p.photoMissing}
        </div>
      )}
    </figure>
  )
}
