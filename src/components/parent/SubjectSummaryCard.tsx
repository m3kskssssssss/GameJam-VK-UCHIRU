// SubjectSummaryCard — compact stats card shown at the top of each subject tab.
// Server component: stateless, receives data as props.
import { ru } from '@/i18n/ru'
import type { SubjectSummary } from '@/server/actions/progress'

const { parent: p } = ru

const numFmt = new Intl.NumberFormat('ru-RU')

interface SubjectSummaryCardProps {
  summary: SubjectSummary
  subjectLabel: string
}

export function SubjectSummaryCard({ summary, subjectLabel }: SubjectSummaryCardProps) {
  return (
    <div
      className="rounded-xl bg-muted border border-border p-4 flex flex-col sm:flex-row gap-4 sm:items-center"
    >
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
          {subjectLabel}
        </p>
        <dl className="grid grid-cols-3 gap-3">
          <div>
            <dt className="text-xs text-muted-foreground">{p.levelLabel}</dt>
            <dd className="text-xl font-extrabold">{numFmt.format(summary.level)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{p.completedLevelsLabel}</dt>
            <dd className="text-xl font-extrabold">{numFmt.format(summary.completedLevels)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{p.totalXpLabel}</dt>
            <dd className="text-xl font-extrabold">{numFmt.format(summary.totalXp)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
