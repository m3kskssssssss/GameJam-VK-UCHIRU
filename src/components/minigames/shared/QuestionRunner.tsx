'use client'

import React from 'react'

const FLASH_STYLE = `
@keyframes kq-flash-fade {
  0%   { opacity: 0.55; }
  60%  { opacity: 0.35; }
  100% { opacity: 0; }
}
.kq-flash-overlay {
  animation: kq-flash-fade 700ms ease-out forwards;
}
`

let styleInjected = false

function ensureFlashStyle() {
  if (typeof document === 'undefined' || styleInjected) return
  const el = document.createElement('style')
  el.textContent = FLASH_STYLE
  document.head.appendChild(el)
  styleInjected = true
}

export interface QuestionRunnerProps {
  currentIndex: number
  totalCount: number
  lastAnswerCorrect: boolean | null
  promptText?: string
  children: React.ReactNode
}

export function QuestionRunner({
  currentIndex,
  totalCount,
  lastAnswerCorrect,
  promptText,
  children,
}: QuestionRunnerProps) {
  React.useEffect(() => {
    ensureFlashStyle()
  }, [])

  const progressPct = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  let flashColour = 'transparent'
  if (lastAnswerCorrect === true) flashColour = '#6BCB77'
  if (lastAnswerCorrect === false) flashColour = '#FF6B6B'

  return (
    <div className="relative min-h-dvh flex flex-col bg-[--color-background]">
      {/* Flash overlay — key trick re-fires animation every state change */}
      {lastAnswerCorrect !== null && (
        <div
          key={`${currentIndex}-${String(lastAnswerCorrect)}`}
          className="kq-flash-overlay fixed inset-0 pointer-events-none z-50"
          style={{ backgroundColor: flashColour }}
          aria-hidden="true"
        />
      )}

      {/* Progress bar — solid neutral track + animated fill */}
      <div className="w-full h-3 bg-black/15">
        <div
          className="h-full bg-[--color-success] transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={totalCount}
        />
      </div>

      {/* Question counter */}
      <div className="px-4 pt-3 pb-1 text-sm font-semibold text-[--color-foreground] opacity-70 text-center">
        Вопрос {currentIndex + 1} из {totalCount}
      </div>

      {/* Centred content column — vertically centred so cards sit in the middle of the viewport */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 w-full">
        {/* Prompt card — centred, max-width */}
        {promptText && (
          <div
            className="w-full max-w-md rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-5"
            style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
          >
            <p
              className="text-[20px] font-semibold text-[--color-foreground] leading-[1.4] text-center whitespace-pre-line"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {promptText}
            </p>
          </div>
        )}

        {/* Answer UI slot — children control their own width via max-w on inner wrappers */}
        <div className="w-full flex justify-center">
          {children}
        </div>
      </div>
    </div>
  )
}
