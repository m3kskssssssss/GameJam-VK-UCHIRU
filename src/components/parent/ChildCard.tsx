// ChildCard — summary card shown in the parent's children list.
// Server component: receives pre-fetched data, renders statically.
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CoinIcon, EnergyIcon } from '@/components/ui/icons'
import { ru } from '@/i18n/ru'
import type { ChildSummary } from '@/server/actions/children'

const { parent: p } = ru

const fmt = new Intl.NumberFormat('ru-RU')

interface ChildCardProps {
  child: ChildSummary & { username: string; avatarUrl?: string | null }
}

/** Returns the first 1–2 letters of a display name for the avatar fallback. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function ChildCard({ child }: ChildCardProps) {
  const totalXp =
    child.perSubject.math.totalXp +
    child.perSubject.reading.totalXp +
    child.perSubject.english.totalXp

  return (
    <article
      className="rounded-[var(--radius-card)] bg-card border border-border p-5 flex flex-col gap-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Top row: avatar + name + homeLevel badge */}
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 text-lg font-bold bg-primary text-primary-foreground shrink-0">
          {child.avatarUrl && (
            <AvatarImage src={child.avatarUrl} alt={child.displayName} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground font-extrabold text-lg">
            {initials(child.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-lg leading-tight truncate">
              {child.displayName}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              {p.childHomeLevel} {child.homeLevel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            @{child.username}
          </p>
        </div>
      </div>

      {/* Stats row: coins / energy / xp */}
      <dl className="grid grid-cols-3 gap-2 text-center">
        <StatCell label={p.childCoins} value={fmt.format(child.coins)} icon={<CoinIcon size={16} />} />
        <StatCell label={p.childEnergy} value={fmt.format(child.energy)} icon={<EnergyIcon size={16} />} />
        <StatCell label={p.totalXpLabel} value={fmt.format(totalXp)} icon={<Sparkles size={16} className="text-amber-500" aria-hidden="true" />} />
      </dl>

      {/* Subject mini-progress */}
      <ul className="flex flex-wrap gap-1.5" aria-label="Прогресс по предметам">
        <SubjectPill label={p.subjectMath} level={child.perSubject.math.level} />
        <SubjectPill label={p.subjectReading} level={child.perSubject.reading.level} />
        <SubjectPill label={p.subjectEnglish} level={child.perSubject.english.level} />
        <SubjectPill
          label={p.subjectPE}
          level={child.perSubject.pe.sessionsCount}
          unitOverride="сессий"
        />
      </ul>

      {/* CTA */}
      <Button asChild className="w-full mt-auto" aria-label={`Открыть профиль ${child.displayName}`}>
        <Link href={`/parent/child/${child.id}`}>{p.btnOpen}</Link>
      </Button>
    </article>
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

function SubjectPill({
  label,
  level,
  unitOverride,
}: {
  label: string
  level: number
  unitOverride?: string
}) {
  const unit = unitOverride ?? `ур.`
  return (
    <li className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-semibold">
      {label} — {fmt.format(level)} {unit}
    </li>
  )
}
