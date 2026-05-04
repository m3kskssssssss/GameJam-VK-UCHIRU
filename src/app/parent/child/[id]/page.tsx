// Child detail page — shows per-child progress, XP chart, subject tabs.
// Server component: all data fetched server-side; only charts and tabs are client.
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CoinIcon, EnergyIcon } from '@/components/ui/icons'
import { XpChart } from '@/components/parent/XpChart'
import { ChildDetailTabs } from '@/components/parent/ChildDetailTabs'
import { DeleteChildDialog } from '@/components/parent/DeleteChildDialog'
import { ChildAvatarSection } from '@/components/parent/ChildAvatarSection'
import { getChildDetail, listAttempts, listPESessions } from '@/server/actions/children'
import { getXpSeries } from '@/server/actions/analytics'
import { prisma } from '@/lib/db'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
})
const numFmt = new Intl.NumberFormat('ru-RU')

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChildDetailPage({ params }: PageProps) {
  const { id } = await params

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

  // Fetch grandparent task completions for the new tab (F.10)
  const grandparentCompletions = await prisma.grandparentTaskCompletion.findMany({
    where: { childId: id },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch avatarUrl directly since ChildDetail doesn't include it
  const childRow = await prisma.child.findUnique({
    where: { id },
    select: { avatarUrl: true, username: true },
  })
  const avatarUrl = childRow?.avatarUrl ?? null

  const totalXp =
    child.perSubject.math.totalXp +
    child.perSubject.reading.totalXp +
    child.perSubject.english.totalXp

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Back button + actions row */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link href="/parent" aria-label={p.btnBack}>
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            {p.btnBack}
          </Link>
        </Button>
        <span className="font-bold truncate flex-1">{child.displayName}</span>
        <DeleteChildDialog childId={child.id} childName={child.displayName} />
      </div>

      {/* Child header card */}
      <section
        className="rounded-[var(--radius-card)] bg-card border border-border p-6 flex flex-col sm:flex-row gap-5"
        style={{ boxShadow: 'var(--shadow-card)' }}
        aria-label={`Профиль ${child.displayName}`}
      >
        {/* Avatar with uploader */}
        <div className="shrink-0 self-center sm:self-start">
          <ChildAvatarSection
            childId={child.id}
            initialUrl={avatarUrl}
            displayName={child.displayName}
          />
        </div>

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
              @{childRow?.username ?? ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.childSince} {dateFmt.format(child.createdAt)}
            </p>
          </div>

          {/* Stats row */}
          <dl className="grid grid-cols-3 gap-2 text-center">
            <StatCell label={p.childCoins} value={numFmt.format(child.coins)} icon={<CoinIcon size={16} />} />
            <StatCell label={p.childEnergy} value={numFmt.format(child.energy)} icon={<EnergyIcon size={16} />} />
            <StatCell label={p.totalXpLabel} value={numFmt.format(totalXp)} icon={<Sparkles size={16} className="text-amber-500" aria-hidden="true" />} />
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
          grandparentCompletions={grandparentCompletions}
        />
      </section>
    </div>
  )
}

function StatCell({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-lg bg-muted py-2 px-1">
      <div
        className="text-base font-bold inline-flex items-center justify-center gap-1.5"
        aria-label={`${label}: ${value}`}
      >
        {icon}
        <span>{value}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}
