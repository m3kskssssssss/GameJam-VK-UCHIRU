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

interface RightItem {
  /** Original index in task.pairs — uniquely identifies this right option even
   *  when two pairs share the same string value. */
  idx: number
  value: string
}

export function MatchPairsItem({ task, disabled, onAnswer }: Props) {
  const rightOptions = useMemo<RightItem[]>(
    () =>
      shuffleByKey(
        task.pairs.map((p, idx) => ({ idx, value: p.right })),
        task.id,
      ),
    [task.id, task.pairs],
  )

  // pairings[leftIdx] = the index of a right option in task.pairs, or null.
  // Storing the index (not the string value) keeps duplicates distinct: if two
  // pairs share the same right text, each button is still its own pickable slot.
  const [pairings, setPairings] = useState<(number | null)[]>(
    () => Array.from({ length: task.pairs.length }, () => null),
  )
  const [activeLeft, setActiveLeft] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Track which right-option indices are already used.
  const usedRightIdx = new Set(pairings.filter((v): v is number => v !== null))

  function pickLeft(idx: number) {
    if (disabled || submitted) return
    setActiveLeft(idx === activeLeft ? null : idx)
  }

  function pickRight(rightIdx: number) {
    if (disabled || submitted) return
    if (activeLeft === null) return
    // If this exact right index is already paired, unpair it from its previous
    // left first. Crucially we compare by index — duplicate right values stay
    // independent of each other.
    const next = pairings.slice()
    for (let i = 0; i < next.length; i++) {
      if (next[i] === rightIdx) next[i] = null
    }
    next[activeLeft] = rightIdx
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
    // Convert indices back to right-string values for the encoded answer.
    const answer = pairings.map((rightIdx) => task.pairs[rightIdx as number]!.right)
    const isCorrect = task.pairs.every((p, i) => p.right === answer[i])
    setSubmitted(true)
    onAnswer(answer, isCorrect)
  }

  const allPaired = pairings.every((p) => p !== null)

  function leftValueOf(leftIdx: number): string | null {
    const ri = pairings[leftIdx]
    if (ri === null || ri === undefined) return null
    return task.pairs[ri]?.right ?? null
  }

  function leftStyle(idx: number): React.CSSProperties {
    if (submitted) {
      const isRight = leftValueOf(idx) === task.pairs[idx]?.right
      return isRight
        ? { backgroundColor: '#D7F2D9', borderColor: '#6BCB77', color: '#1F2937' }
        : { backgroundColor: '#FFD9D9', borderColor: '#FF6B6B', color: '#1F2937' }
    }
    if (activeLeft === idx) {
      return { backgroundColor: '#4DA8DA', borderColor: '#3D8BB8', color: '#FFFFFF' }
    }
    if (pairings[idx] !== null && pairings[idx] !== undefined) {
      return { backgroundColor: '#FFE8C7', borderColor: '#FFB347', color: '#1F2937' }
    }
    return { backgroundColor: '#F1ECE2', borderColor: '#C9C0AE', color: '#1F2937' }
  }

  function rightStyle(item: RightItem): React.CSSProperties {
    const used = usedRightIdx.has(item.idx)
    if (used) {
      return { backgroundColor: '#FFE8C7', borderColor: '#FFB347', color: '#1F2937', opacity: 0.7 }
    }
    if (activeLeft !== null) {
      return { backgroundColor: '#FFFFFF', borderColor: '#4DA8DA', color: '#1F2937' }
    }
    return { backgroundColor: '#F1ECE2', borderColor: '#C9C0AE', color: '#1F2937', opacity: 0.7 }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      <p className="text-sm text-center text-[--color-foreground] opacity-70">
        Соедини: тапни слева, потом справа.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          {task.pairs.map((p, i) => {
            const pairedValue = leftValueOf(i)
            return (
              <button
                key={`L-${i}`}
                type="button"
                disabled={disabled || submitted}
                onClick={() =>
                  pairings[i] !== null && !submitted ? clearPair(i) : pickLeft(i)
                }
                style={leftStyle(i)}
                className="
                  min-h-[52px] rounded-[0.75rem] border-2 px-3 py-2
                  text-base font-semibold text-left
                  transition-all duration-150 cursor-pointer
                  disabled:cursor-not-allowed
                "
              >
                <span className="block text-xs opacity-60">{i + 1}</span>
                <span>{p.left}</span>
                {pairedValue !== null && (
                  <span className="block text-xs mt-1 opacity-80">→ {pairedValue}</span>
                )}
              </button>
            )
          })}
        </div>
        {/* Right column */}
        <div className="flex flex-col gap-2">
          {rightOptions.map((item) => (
            <button
              key={`R-${item.idx}`}
              type="button"
              disabled={disabled || submitted || activeLeft === null || usedRightIdx.has(item.idx)}
              onClick={() => pickRight(item.idx)}
              style={rightStyle(item)}
              className="
                min-h-[52px] rounded-[0.75rem] border-2 px-3 py-2
                text-base font-semibold text-center
                transition-all duration-150 cursor-pointer
                disabled:cursor-not-allowed
              "
            >
              {item.value}
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
