'use client'
// RelativeCard — shows a relative's avatar, name, and opens ManageRelativeSheet.
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ManageRelativeSheet } from '@/components/parent/relatives/ManageRelativeSheet'
import type { RelativeListItem } from '@/server/actions/relatives'
import { ru } from '@/i18n/ru'

const { parent: p } = ru
const r = p.relatives

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dateFmt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' })

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

interface RelativeCardProps {
  relative: RelativeListItem
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RelativeCard({ relative }: RelativeCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <article
        className="rounded-[var(--radius-card)] bg-card border border-border p-5 flex flex-col items-center gap-4 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <Avatar className="h-16 w-16">
          {relative.avatarUrl && (
            <AvatarImage src={relative.avatarUrl} alt={relative.displayName} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground font-extrabold text-xl">
            {initials(relative.displayName)}
          </AvatarFallback>
        </Avatar>

        <div>
          <p className="font-bold">{relative.displayName}</p>
          <p className="text-sm text-muted-foreground">@{relative.username}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {r.since} {dateFmt.format(relative.createdAt)}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSheetOpen(true)}
          className="w-full"
        >
          {r.btnManage}
        </Button>
      </article>

      <ManageRelativeSheet
        relativeId={relative.id}
        relativeName={relative.displayName}
        relativeUsername={relative.username}
        relativeAvatarUrl={relative.avatarUrl}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  )
}
