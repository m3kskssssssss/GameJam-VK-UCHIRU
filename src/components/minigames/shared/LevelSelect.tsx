'use client'

export interface LevelSelectProps {
  subjectLabel: string
  currentLevel: number
  completedLevels: number
  grade?: number
  onStart: (level: number) => void
  onExit: () => void
  loading?: boolean
}

export function LevelSelect({
  subjectLabel,
  currentLevel,
  completedLevels,
  grade,
  onStart,
  onExit,
  loading = false,
}: LevelSelectProps) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background] p-4">
      <div
        className="w-full max-w-sm rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-8 flex flex-col items-center gap-5"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
      >
        {/* Subject label */}
        <p className="text-base font-semibold text-[--color-foreground] tracking-wide uppercase opacity-60">
          {subjectLabel}
        </p>

        {/* Grade pill */}
        {typeof grade === 'number' && (
          <div className="rounded-full bg-[--color-primary]/15 border border-[--color-primary]/30 px-4 py-1.5">
            <p className="text-sm font-bold text-[--color-primary]">
              Класс {grade}
            </p>
          </div>
        )}

        {/* Level heading */}
        <h1
          className="text-[28px] font-extrabold text-[--color-foreground] text-center leading-tight"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Уровень {currentLevel}
        </h1>

        {/* Progress sub-line */}
        <p className="text-base text-[--color-foreground] opacity-80 text-center">
          Пройдено уровней: <span className="font-bold">{completedLevels}</span> из 10
        </p>

        {/* Start button — explicit colours to dodge tailwind-merge dropping CSS-var arbitraries */}
        <button
          type="button"
          onClick={() => onStart(currentLevel)}
          disabled={loading}
          style={{ backgroundColor: '#4DA8DA', color: '#FFFFFF' }}
          className="w-full min-h-[56px] text-lg font-extrabold rounded-[0.75rem] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:brightness-95 active:scale-[0.98] transition-all"
        >
          {loading ? 'Загрузка...' : 'Начать'}
        </button>

        {/* Exit ghost button */}
        <button
          type="button"
          onClick={onExit}
          disabled={loading}
          style={{ backgroundColor: '#FFF9F0', color: '#1F2937', borderColor: '#C9C0AE' }}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] border-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 active:scale-[0.98] transition-all"
        >
          Выйти
        </button>
      </div>
    </div>
  )
}
