'use client'

import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LevelSelectProps {
  subjectLabel: string
  currentLevel: number
  completedLevels: number
  onStart: (level: number) => void
  onExit: () => void
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LevelSelect({
  subjectLabel,
  currentLevel,
  completedLevels,
  onStart,
  onExit,
  loading = false,
}: LevelSelectProps) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background] p-4">
      <div
        className="w-full max-w-sm rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-8 flex flex-col items-center gap-6"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
      >
        {/* Subject label */}
        <p className="text-base font-semibold text-[--color-foreground] tracking-wide uppercase opacity-60">
          {subjectLabel}
        </p>

        {/* Level heading */}
        <h1
          className="text-[28px] font-extrabold text-[--color-foreground] text-center leading-tight"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Уровень {currentLevel}
        </h1>

        {/* Progress sub-line */}
        <p className="text-base text-[--color-foreground] opacity-70 text-center">
          Пройдено уровней: <span className="font-bold">{completedLevels}</span> из 10
        </p>

        {/* Start button */}
        <Button
          onClick={() => onStart(currentLevel)}
          disabled={loading}
          className="w-full min-h-[56px] text-lg font-semibold rounded-[0.75rem] bg-[--color-primary] text-white hover:bg-[--color-primary]/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Загрузка...' : 'Начать'}
        </Button>

        {/* Exit ghost button */}
        <Button
          variant="ghost"
          onClick={onExit}
          disabled={loading}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-muted] text-[--color-foreground] hover:bg-[--color-border] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Выйти
        </Button>
      </div>
    </div>
  )
}
