'use client'

import { ScrollArea } from '@/components/ui/scroll-area'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PassageViewerProps {
  text: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SHORT_THRESHOLD = 300

export function PassageViewer({ text }: PassageViewerProps) {
  const isShort = text.length < SHORT_THRESHOLD

  const inner = (
    <div
      className="rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-4"
      style={{ boxShadow: '0 4px 12px rgba(31,41,55,0.07)' }}
    >
      <p
        className="text-base text-[--color-foreground] leading-[1.6] whitespace-pre-wrap"
        style={{ fontFamily: 'var(--font-sans)', fontSize: '16px' }}
      >
        {text}
      </p>
    </div>
  )

  if (isShort) {
    return <div className="mx-4 mb-4">{inner}</div>
  }

  return (
    <div className="mx-4 mb-4">
      <ScrollArea
        className="rounded-[1rem]"
        style={{ maxHeight: 'min(35vh, 240px)' }}
      >
        {inner}
      </ScrollArea>
    </div>
  )
}
