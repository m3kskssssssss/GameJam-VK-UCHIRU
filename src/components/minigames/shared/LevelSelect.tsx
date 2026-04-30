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

const TOTAL_LEVELS = 10

export function LevelSelect({
  subjectLabel,
  currentLevel,
  completedLevels,
  grade,
  onStart,
  onExit,
  loading = false,
}: LevelSelectProps) {
  // Path visualisation:
  //  - levels 1..completedLevels  → done (green check)
  //  - level   = currentLevel     → current (blue, pulsing)
  //  - rest                       → upcoming (muted)
  // currentLevel always points at the next playable level.
  const completed = Math.max(0, Math.min(TOTAL_LEVELS, completedLevels))
  const current = Math.max(1, Math.min(TOTAL_LEVELS, currentLevel))
  const passedAll = completed >= TOTAL_LEVELS

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background] p-4">
      <div
        className="w-full max-w-md rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-6 sm:p-8 flex flex-col items-center gap-5"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
      >
        {/* Subject label */}
        <p
          className="text-base font-semibold tracking-wide uppercase opacity-60"
          style={{ color: '#1F2937' }}
        >
          {subjectLabel}
        </p>

        {/* Grade pill */}
        {typeof grade === 'number' && (
          <div
            className="rounded-full px-4 py-1.5 border"
            style={{ backgroundColor: '#E1F0F8', borderColor: '#4DA8DA' }}
          >
            <p className="text-sm font-bold" style={{ color: '#1F4F6E' }}>
              Класс {grade}
            </p>
          </div>
        )}

        {/* Path / level grid — 5×2 on mobile, 10×1 on desktop */}
        <div className="w-full">
          <p
            className="text-sm text-center mb-3 opacity-80"
            style={{ color: '#1F2937' }}
          >
            Твой путь
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
              const level = i + 1
              const isDone = level <= completed
              const isCurrent = !isDone && level === current
              const isLocked = !isDone && !isCurrent

              const cellStyle: React.CSSProperties = isDone
                ? { backgroundColor: '#6BCB77', borderColor: '#4CAA56', color: '#FFFFFF' }
                : isCurrent
                  ? { backgroundColor: '#4DA8DA', borderColor: '#3D8BB8', color: '#FFFFFF' }
                  : { backgroundColor: '#FFF9F0', borderColor: '#C9C0AE', color: '#8C7E6A' }

              return (
                <div
                  key={level}
                  style={cellStyle}
                  className={`
                    relative aspect-square rounded-[0.6rem] border-2
                    flex items-center justify-center
                    text-base font-extrabold
                    ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-[#F1ECE2]' : ''}
                  `}
                  aria-label={
                    isDone
                      ? `Уровень ${level} пройден`
                      : isCurrent
                        ? `Уровень ${level} — текущий`
                        : `Уровень ${level} закрыт`
                  }
                >
                  {isDone ? (
                    <svg
                      viewBox="0 0 20 20"
                      width="60%"
                      height="60%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  ) : (
                    <span>{level}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress sub-line under the path */}
          <p
            className="text-sm text-center mt-3 opacity-80"
            style={{ color: '#1F2937' }}
          >
            Пройдено: <span className="font-bold">{completed}</span> из {TOTAL_LEVELS}
          </p>
        </div>

        {/* Headline for the level being started */}
        <h1
          className="text-[24px] sm:text-[28px] font-extrabold text-center leading-tight"
          style={{ fontFamily: 'var(--font-sans)', color: '#1F2937' }}
        >
          {passedAll ? `Все уровни пройдены!` : `Уровень ${current}`}
        </h1>

        {/* Start button */}
        <button
          type="button"
          onClick={() => onStart(current)}
          disabled={loading}
          style={{ backgroundColor: '#4DA8DA', color: '#FFFFFF' }}
          className="w-full min-h-[56px] text-lg font-extrabold rounded-[0.75rem] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:brightness-95 active:scale-[0.98] transition-all"
        >
          {loading ? 'Загрузка...' : passedAll ? 'Сыграть ещё' : 'Начать'}
        </button>

        {/* Exit button */}
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
