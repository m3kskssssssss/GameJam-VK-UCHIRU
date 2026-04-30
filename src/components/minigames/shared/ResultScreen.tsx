'use client'

import { Trophy, RotateCcw, Coins, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ResultScreenProps {
  passed: boolean
  correctCount: number
  totalCount: number
  coinsEarned: number
  energyEarned: number
  xpEarned: number
  newLevel: number
  onNextLevel: () => void
  onExit: () => void
  loading?: boolean
  /** Override the primary button label when passed=true. Defaults to "Перейти к следующему уровню". */
  nextLevelLabel?: string
}

// ---------------------------------------------------------------------------
// Reward pill
// ---------------------------------------------------------------------------

function Pill({
  colour,
  children,
}: {
  colour: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-bold text-white"
      style={{ backgroundColor: colour }}
    >
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResultScreen({
  passed,
  correctCount,
  totalCount,
  coinsEarned,
  energyEarned,
  xpEarned,
  newLevel: _newLevel,
  onNextLevel,
  onExit,
  loading = false,
  nextLevelLabel,
}: ResultScreenProps) {
  const showRewards = passed && (coinsEarned > 0 || xpEarned > 0)

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background] p-4">
      <div
        className="w-full max-w-sm rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-8 flex flex-col items-center gap-5"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full"
          style={{ backgroundColor: passed ? '#6BCB77' : '#FF6B6B' }}
        >
          {passed
            ? <Trophy size={40} color="white" strokeWidth={2} />
            : <RotateCcw size={40} color="white" strokeWidth={2} />
          }
        </div>

        {/* Heading */}
        <h1
          className="text-[28px] font-extrabold text-[--color-foreground] text-center"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {passed ? 'Молодец!' : 'Попробуй ещё!'}
        </h1>

        {/* Score */}
        <p className="text-xl font-semibold text-[--color-foreground] opacity-80">
          {correctCount} / {totalCount}
        </p>

        {/* Reward pills — only shown when passed and there are rewards */}
        {showRewards && (
          <div className="flex flex-wrap justify-center gap-2">
            <Pill colour="#FFB347">
              <Coins size={18} />
              +{coinsEarned}
            </Pill>
            <Pill colour="#6BCB77">
              <Zap size={18} />
              +{energyEarned}
            </Pill>
            <Pill colour="#4DA8DA">
              +{xpEarned} XP
            </Pill>
          </div>
        )}

        {/* Primary action */}
        <Button
          onClick={onNextLevel}
          disabled={loading}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-primary] text-white hover:bg-[--color-primary]/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Загрузка...'
            : passed
              ? (nextLevelLabel ?? 'Перейти к следующему уровню')
              : 'Попробовать снова'
          }
        </Button>

        {/* Exit ghost button — bordered so it stays visible against the muted card */}
        <Button
          variant="ghost"
          onClick={onExit}
          disabled={loading}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-background] text-[--color-foreground] border border-[--color-border] hover:bg-[--color-border] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Выйти из домика
        </Button>
      </div>
    </div>
  )
}
