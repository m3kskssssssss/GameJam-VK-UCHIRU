// PESessionsList — feed of physical education sessions for the parent dashboard.
// Server component: receives pre-fetched data as props.
import { PEPhoto } from '@/components/parent/PEPhoto'
import { CoinIcon } from '@/components/ui/icons'
import { ru } from '@/i18n/ru'
import type { PESessionRecord } from '@/server/actions/children'

const { parent: p } = ru

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'short',
})
const numFmt = new Intl.NumberFormat('ru-RU')

interface PESessionsListProps {
  sessions: PESessionRecord[]
}

export function PESessionsList({ sessions }: PESessionsListProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {p.noPESessions}
      </p>
    )
  }

  return (
    <ol className="space-y-4" aria-label={p.peSessionsTitle}>
      {sessions.map((session) => (
        <li key={session.id}>
          <PESessionCard session={session} />
        </li>
      ))}
    </ol>
  )
}

function PESessionCard({ session }: { session: PESessionRecord }) {
  return (
    <article
      className="rounded-[var(--radius-card)] bg-card border border-border p-4 space-y-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-base leading-tight">
            {session.exerciseName}
          </h4>
          <time
            dateTime={session.createdAt.toISOString()}
            className="text-xs text-muted-foreground block mt-0.5"
          >
            {dateFmt.format(session.createdAt)}
          </time>
        </div>
        <div className="text-sm text-muted-foreground shrink-0 inline-flex items-center gap-1">
          +{numFmt.format(session.coinsEarned)} <CoinIcon size={14} />
        </div>
      </div>

      {/* Photos — side by side on sm+, stacked on smaller */}
      <div className="flex flex-col sm:flex-row gap-3">
        <PEPhoto label={p.photoSlot10s} signedUrl={session.photo10sUrl} />
        <PEPhoto label={p.photoSlot60s} signedUrl={session.photo60sUrl} />
      </div>
    </article>
  )
}
