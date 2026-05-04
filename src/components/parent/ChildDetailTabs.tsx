'use client'
// ChildDetailTabs — tab navigation for the child detail page.
// 5 tabs: Math, Reading, English, PE, Grandparent.
// Client component because Radix Tabs requires interaction state.
import { useState } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SubjectSummaryCard } from '@/components/parent/SubjectSummaryCard'
import { AttemptsList } from '@/components/parent/AttemptsList'
import { PESessionsList } from '@/components/parent/PESessionsList'
import { CoinIcon, EnergyIcon } from '@/components/ui/icons'
import { ru } from '@/i18n/ru'
import type { ChildDetail, TaskAttemptRecord, PESessionRecord } from '@/server/actions/children'

const { parent: p } = ru
const gt = p.grandparentTab

const numFmt = new Intl.NumberFormat('ru-RU')
const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'short',
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GrandparentCompletion = {
  id: string
  grandparent: 'GRANDMA' | 'GRANDPA'
  taskKey: string
  taskName: string
  photoUrl: string
  photoKey: string
  coinsEarned: number
  energyEarned: number
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChildDetailTabsProps {
  child: ChildDetail
  mathAttempts: TaskAttemptRecord[]
  readingAttempts: TaskAttemptRecord[]
  englishAttempts: TaskAttemptRecord[]
  peSessions: PESessionRecord[]
  grandparentCompletions: GrandparentCompletion[]
}

// ---------------------------------------------------------------------------
// GrandparentTab — inner component
// ---------------------------------------------------------------------------

function GrandparentTab({
  completions,
}: {
  completions: GrandparentCompletion[]
}) {
  const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null)

  const grandmaItems = completions.filter((c) => c.grandparent === 'GRANDMA')
  const grandpaItems = completions.filter((c) => c.grandparent === 'GRANDPA')

  if (completions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">{gt.empty}</p>
    )
  }

  function Section({
    items,
    label,
  }: {
    items: GrandparentCompletion[]
    label: string
  }) {
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">{label}</h4>
        {items.map((c) => (
          <div
            key={c.id}
            className="rounded-xl bg-muted border border-border p-3 flex gap-3"
          >
            {/* Thumbnail */}
            <button
              type="button"
              onClick={() => setEnlargedUrl(c.photoUrl)}
              aria-label={gt.enlargePhoto}
              className="shrink-0 rounded-lg overflow-hidden w-16 h-16 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.photoUrl}
                alt={gt.photoAlt}
                className="w-full h-full object-cover"
              />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight">{c.taskName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dateFmt.format(c.createdAt)}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {c.coinsEarned > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-full px-2 py-0.5">
                    <CoinIcon size={12} /> {numFmt.format(c.coinsEarned)}
                  </span>
                )}
                {c.energyEarned > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-full px-2 py-0.5">
                    <EnergyIcon size={12} /> {numFmt.format(c.energyEarned)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Section items={grandmaItems} label={gt.grandmaSection} />
        <Section items={grandpaItems} label={gt.grandpaSection} />
      </div>

      {/* Enlarge photo dialog */}
      <Dialog open={enlargedUrl !== null} onOpenChange={(v) => { if (!v) setEnlargedUrl(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{gt.photoAlt}</DialogTitle>
          </DialogHeader>
          {enlargedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={enlargedUrl}
              alt={gt.photoAlt}
              className="w-full rounded-lg object-contain max-h-[70dvh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// ChildDetailTabs
// ---------------------------------------------------------------------------

export function ChildDetailTabs({
  child,
  mathAttempts,
  readingAttempts,
  englishAttempts,
  peSessions,
  grandparentCompletions,
}: ChildDetailTabsProps) {
  return (
    <Tabs defaultValue="math" className="w-full">
      <TabsList className="w-full flex overflow-x-auto sm:inline-flex h-auto gap-1 p-1">
        <TabsTrigger value="math" className="flex-1 sm:flex-none">
          {p.subjectMath}
        </TabsTrigger>
        <TabsTrigger value="reading" className="flex-1 sm:flex-none">
          {p.subjectReading}
        </TabsTrigger>
        <TabsTrigger value="english" className="flex-1 sm:flex-none">
          {p.subjectEnglish}
        </TabsTrigger>
        <TabsTrigger value="pe" className="flex-1 sm:flex-none">
          {p.subjectPE}
        </TabsTrigger>
        <TabsTrigger value="grandparent" className="flex-1 sm:flex-none">
          {gt.label}
        </TabsTrigger>
      </TabsList>

      {/* Math */}
      <TabsContent value="math" className="space-y-4 mt-4">
        <SubjectSummaryCard
          summary={child.perSubject.math}
          subjectLabel={p.subjectMath}
        />
        <AttemptsList attempts={mathAttempts} />
      </TabsContent>

      {/* Reading */}
      <TabsContent value="reading" className="space-y-4 mt-4">
        <SubjectSummaryCard
          summary={child.perSubject.reading}
          subjectLabel={p.subjectReading}
        />
        <AttemptsList attempts={readingAttempts} />
      </TabsContent>

      {/* English */}
      <TabsContent value="english" className="space-y-4 mt-4">
        <SubjectSummaryCard
          summary={child.perSubject.english}
          subjectLabel={p.subjectEnglish}
        />
        <AttemptsList attempts={englishAttempts} />
      </TabsContent>

      {/* PE */}
      <TabsContent value="pe" className="space-y-4 mt-4">
        <div className="rounded-xl bg-muted border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
            {p.subjectPE}
          </p>
          <dl>
            <dt className="text-xs text-muted-foreground">{p.sessionsCountLabel}</dt>
            <dd className="text-xl font-extrabold">
              {new Intl.NumberFormat('ru-RU').format(child.perSubject.pe.sessionsCount)}
            </dd>
          </dl>
        </div>
        <PESessionsList sessions={peSessions} />
      </TabsContent>

      {/* Grandparent */}
      <TabsContent value="grandparent" className="mt-4">
        <GrandparentTab completions={grandparentCompletions} />
      </TabsContent>
    </Tabs>
  )
}
