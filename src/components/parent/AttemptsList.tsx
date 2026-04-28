// AttemptsList — displays a list of TaskAttempt records for one academic subject.
// Server component: receives pre-fetched data as props.
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ru } from '@/i18n/ru'
import type { TaskAttemptRecord } from '@/server/actions/children'

const { parent: p } = ru

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'short',
})
const numFmt = new Intl.NumberFormat('ru-RU')

interface AttemptsListProps {
  attempts: TaskAttemptRecord[]
}

export function AttemptsList({ attempts }: AttemptsListProps) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {p.noAttempts}
      </p>
    )
  }

  return (
    <ol className="space-y-0" aria-label={p.attemptsTitle}>
      {attempts.map((attempt, index) => (
        <li key={attempt.id}>
          <AttemptRow attempt={attempt} />
          {index < attempts.length - 1 && <Separator />}
        </li>
      ))}
    </ol>
  )
}

function AttemptRow({ attempt }: { attempt: TaskAttemptRecord }) {
  const scoreLabel = `${numFmt.format(attempt.correctCount)}/${numFmt.format(attempt.totalCount)}`

  return (
    <article className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {/* Date + level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">
            {p.attemptLevel} {numFmt.format(attempt.level)}
          </span>
          <Badge
            variant={attempt.passed ? 'default' : 'destructive'}
            className={
              attempt.passed
                ? 'bg-success text-white border-transparent'
                : undefined
            }
          >
            {attempt.passed ? p.attemptPassed : p.attemptFailed}
          </Badge>
        </div>
        <time
          dateTime={attempt.createdAt.toISOString()}
          className="text-xs text-muted-foreground mt-0.5 block"
        >
          {dateFmt.format(attempt.createdAt)}
        </time>
      </div>

      {/* Score + coins */}
      <div className="flex items-center gap-4 text-sm shrink-0">
        <span className="font-semibold">
          {p.attemptScore}: <strong>{scoreLabel}</strong>
        </span>
        <span className="text-muted-foreground">
          +{numFmt.format(attempt.coinsEarned)} {p.attemptCoins}
        </span>
      </div>
    </article>
  )
}
