'use client'

import { useState, useMemo } from 'react'
import type { MatchPairsTask } from '@/server/content/types'

interface Props {
  task: MatchPairsTask
  disabled: boolean
  onAnswer: (value: string[], isCorrect: boolean) => void
}

// Stable shuffle using a deterministic seed from a string (task.id) so the right-column
// order is consistent across renders.
function shuffleByKey<T>(arr: T[], key: string): T[] {
  let seed = 0
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0
    const j = seed % (i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function MatchPairsItem({ task, disabled, onAnswer }: Props) {
  const rightOptions = useMemo(
    () => shuffleByKey(task.pairs.map((p) => p.right), task.id),
    [task.id, task.pairs],
  )
  // pairings[leftIdx] = rightOption (string) or null
  const [pairings, setPairings] = useState<(string | null)[]>(
    () => Array.from({ length: task.pairs.length }, () => null),
  )
  const [activeLeft, setActiveLeft] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Track which right option is already used
  const usedRights = new Set(pairings.filter((v) => v !== null) as string[])

  function pickLeft(idx: number) {
    if (disabled || submitted) return
    setActiveLeft(idx === activeLeft ? null : idx)
  }

  function pickRight(value: string) {
    if (disabled || submitted) return
    if (activeLeft === null) return
    // If this right is already paired, unpair it from its previous left
    const next = pairings.slice()
    for (let i = 0; i < next.length; i++) {
      if (next[i] === value) next[i] = null
    }
    next[activeLeft] = value
    setPairings(next)
    setActiveLeft(null)
  }

  function clearPair(leftIdx: number) {
    if (disabled || submitted) return
    const next = pairings.slice()
    next[leftIdx] = null
    setPairings(next)
  }

  function submit() {
    if (disabled || submitted) return
    if (pairings.some((p) => p === null)) return
    const answer = pairings as string[]
    const isCorrect = task.pairs.every((p, i) => p.right === answer[i])
    setSubmitted(true)
    onAnswer(answer, isCorrect)
  }

  const allPaired = pairings.every((p) => p !== null)

  function leftClasses(idx: number): string {
    if (submitted) {
      const isRight = pairings[idx] === task.pairs[idx]?.right
      return isRight
        ? 'bg-[#6BCB77]/30 border-[#6BCB77] text-[--color-foreground]'
        : 'bg-[#FF6B6B]/30 border-[#FF6B6B] text-[--color-foreground]'
    }
    if (activeLeft === idx) {
      return 'bg-[--color-primary] border-[--color-primary] text-white'
    }
    if (pairings[idx]) {
      return 'bg-[--color-accent]/30 border-[--color-accent] text-[--color-foreground]'
    }
    return 'bg-[--color-muted] border-[--color-border] text-[--color-foreground] hover:border-[--color-primary]'
  }

  function rightClasses(value: string): string {
    const used = usedRights.has(value)
    if (used) {
      return 'bg-[--color-accent]/30 border-[--color-accent] text-[--color-foreground] opacity-70'
    }
    if (activeLeft !== null) {
      return 'bg-[--color-muted] border-[--color-primary] text-[--color-foreground] hover:bg-[--color-primary] hover:text-white'
    }
    return 'bg-[--color-muted] border-[--color-border] text-[--color-foreground] opacity-60'
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      <p className="text-sm text-center text-[--color-foreground] opacity-70">
        Соедини: тапни слева, потом справа.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          {task.pairs.map((p, i) => (
            <button
              key={`L-${i}`}
              type="button"
              disabled={disabled || submitted}
              onClick={() =>
                pairings[i] !== null && !submitted ? clearPair(i) : pickLeft(i)
              }
              className={`
                min-h-[52px] rounded-[0.75rem] border-2 px-3 py-2
                text-base font-semibold text-left
                transition-all duration-150 cursor-pointer
                disabled:cursor-not-allowed
                ${leftClasses(i)}
              `}
            >
              <span className="block text-xs opacity-60">{i + 1}</span>
              <span>{p.left}</span>
              {pairings[i] && (
                <span className="block text-xs mt-1 opacity-80">→ {pairings[i]}</span>
              )}
            </button>
          ))}
        </div>
        {/* Right column */}
        <div className="flex flex-col gap-2">
          {rightOptions.map((value) => (
            <button
              key={`R-${value}`}
              type="button"
              disabled={disabled || submitted || activeLeft === null || usedRights.has(value)}
              onClick={() => pickRight(value)}
              className={`
                min-h-[52px] rounded-[0.75rem] border-2 px-3 py-2
                text-base font-semibold text-center
                transition-all duration-150 cursor-pointer
                disabled:cursor-not-allowed
                ${rightClasses(value)}
              `}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {!submitted && (
        <button
          type="button"
          disabled={disabled || !allPaired}
          onClick={submit}
          style={{ backgroundColor: '#4DA8DA', color: '#FFFFFF' }}
          className="
            w-full min-h-[56px] rounded-[0.75rem]
            text-lg font-extrabold shadow-md
            hover:brightness-95 active:scale-[0.97]
            disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
            transition-all duration-150
          "
        >
          Готово
        </button>
      )}
    </div>
  )
}
