// Child detail page — shows per-child progress, XP chart, subject tabs.
// Server component: all data fetched server-side; only charts and tabs are client.
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { XpChart } from '@/components/parent/XpChart'
import { ChildDetailTabs } from '@/components/parent/ChildDetailTabs'
import { DeleteChildDialog } from '@/components/parent/DeleteChildDialog'
import { getChildDetail, listAttempts, listPESessions } from '@/server/actions/children'
import { getXpSeries } from '@/server/actions/analytics'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
})
const numFmt = new Intl.NumberFormat('ru-RU')

/** Returns up to 2 uppercase initials from a display name. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChildDetailPage({ params }: PageProps) {
  const { id } = await params

  // Fetch all data in parallel. If the child doesn't belong to this parent,
  // getChildDetail throws ACCESS_DENIED — surface as 404.
  let child, mathAttempts, readingAttempts, englishAttempts, peSessions, xpSeries

  try {
    ;[child, mathAttempts, readingAttempts, englishAttempts, peSessions, xpSeries] =
      await Promise.all([
        getChildDetail({ childId: id }),
        listAttempts({ childId: id, subject: 'MATH', take: 50 }),
        listAttempts({ childId: id, subject: 'READING', take: 50 }),
        listAttempts({ childId: id, subject: 'ENGLISH', take: 50 }),
        listPESessions({ childId: id, take: 50 }),
        getXpSeries({ childId: id, days: 14 }),
      ])
  } catch {
    notFound()
  }

  const totalXp =
    child.perSubject.math.totalXp +
    child.perSubject.reading.totalXp +
    child.perSubject.english.totalXp

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/parent" aria-label={p.btnBack}>
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              {p.btnBack}
            </Link>
          </Button>
          <span className="font-bold truncate flex-1">{child.displayName}</span>
          <DeleteChildDialog childId={child.id} childName={child.displayName} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Child header card */}
        <section
          className="rounded-[var(--radius-card)] bg-card border border-border p-6 flex flex-col sm:flex-row gap-5"
          style={{ boxShadow: 'var(--shadow-card)' }}
          aria-label={`Профиль ${child.displayName}`}
        >
          <Avatar className="h-20 w-20 text-2xl font-extrabold shrink-0 self-center sm:self-start">
            <AvatarFallback className="bg-primary text-primary-foreground font-extrabold text-2xl h-full w-full">
              {initials(child.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-extrabold leading-tight">
                  {child.displayName}
                </h2>
                <Badge variant="secondary">
                  {p.childHomeLevel} {numFmt.format(child.homeLevel)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                @{child.username}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {p.childSince} {dateFmt.format(child.createdAt)}
              </p>
            </div>

            {/* Stats row */}
            <dl className="grid grid-cols-3 gap-2 text-center">
              <StatCell label={p.childCoins} value={numFmt.format(child.coins)} emoji="🪙" />
              <StatCell label={p.childEnergy} value={numFmt.format(child.energy)} emoji="⚡" />
              <StatCell label={p.totalXpLabel} value={numFmt.format(totalXp)} emoji="✨" />
            </dl>
          </div>
        </section>

        {/* XP Chart */}
        <section aria-labelledby="xp-chart-heading">
          <h3 id="xp-chart-heading" className="text-lg font-bold mb-3">
            {p.xpChartTitle}
          </h3>
          <div
            className="rounded-[var(--radius-card)] bg-card border border-border p-4"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <XpChart data={xpSeries} />
          </div>
        </section>

        {/* Subject tabs */}
        <section aria-label="Прогресс по предметам">
          <ChildDetailTabs
            child={child}
            mathAttempts={mathAttempts}
            readingAttempts={readingAttempts}
            englishAttempts={englishAttempts}
            peSessions={peSessions}
          />
        </section>
      </div>
    </main>
  )
}

function StatCell({
  label,
  value,
  emoji,
}: {
  label: string
  value: string
  emoji: string
}) {
  return (
    <div className="rounded-lg bg-muted py-2 px-1">
      <div className="text-base font-bold">
        <span aria-hidden="true">{emoji}</span> {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}
