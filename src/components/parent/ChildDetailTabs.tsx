'use client'
// ChildDetailTabs — 4-tab navigation for the child detail page.
// Client component because Radix Tabs requires interaction state.
// All data is passed in as props (fetched server-side in the page).
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { SubjectSummaryCard } from '@/components/parent/SubjectSummaryCard'
import { AttemptsList } from '@/components/parent/AttemptsList'
import { PESessionsList } from '@/components/parent/PESessionsList'
import { ru } from '@/i18n/ru'
import type { ChildDetail, TaskAttemptRecord, PESessionRecord } from '@/server/actions/children'

const { parent: p } = ru

interface ChildDetailTabsProps {
  child: ChildDetail
  mathAttempts: TaskAttemptRecord[]
  readingAttempts: TaskAttemptRecord[]
  englishAttempts: TaskAttemptRecord[]
  peSessions: PESessionRecord[]
}

export function ChildDetailTabs({
  child,
  mathAttempts,
  readingAttempts,
  englishAttempts,
  peSessions,
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
    </Tabs>
  )
}
