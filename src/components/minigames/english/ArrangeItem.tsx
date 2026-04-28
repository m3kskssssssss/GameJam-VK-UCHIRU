'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ArrangeItemProps {
  promptText: string   // e.g., "Собери: I am happy"
  words: string[]      // shuffled word chips to arrange
  onSubmit: (joined: string) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

function Chip({
  label,
  onClick,
  variant,
  disabled,
}: {
  label: string
  onClick: () => void
  variant: 'selected' | 'available'
  disabled: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-1 px-[14px] py-2 rounded-full min-h-[40px] text-base font-semibold transition-colors duration-100 cursor-pointer select-none'
  const colours =
    variant === 'selected'
      ? 'bg-[--color-primary] text-white hover:bg-[--color-primary]/80'
      : 'bg-[--color-muted] border border-[--color-border] text-[--color-foreground] hover:bg-[--color-border]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${colours} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArrangeItem({
  promptText,
  words,
  onSubmit,
  disabled = false,
}: ArrangeItemProps) {
  // Initialise from props — words are already shuffled by the content layer
  const [available, setAvailable] = useState<string[]>(() => [...words])
  const [selected, setSelected] = useState<string[]>([])

  function moveToSelected(index: number) {
    if (disabled) return
    const word = available[index]
    setAvailable((prev) => prev.filter((_, i) => i !== index))
    setSelected((prev) => [...prev, word])
  }

  function moveToAvailable(index: number) {
    if (disabled) return
    const word = selected[index]
    setSelected((prev) => prev.filter((_, i) => i !== index))
    setAvailable((prev) => [...prev, word])
  }

  function handleSubmit() {
    if (disabled || selected.length === 0) return
    onSubmit(selected.join(' '))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Prompt */}
      <p className="text-[18px] font-semibold text-[--color-foreground] opacity-80 leading-snug">
        {promptText}
      </p>

      {/* Construction line — selected words */}
      <div
        className="min-h-[56px] w-full rounded-[0.75rem] border-2 border-dashed border-[--color-border] bg-[--color-muted]/60 p-3 flex flex-wrap gap-2 items-center"
        aria-label="Собранная фраза"
      >
        {selected.length === 0 ? (
          <span className="text-[--color-foreground] opacity-30 text-sm">
            Нажимай слова снизу…
          </span>
        ) : (
          selected.map((word, i) => (
            <Chip
              key={`sel-${i}-${word}`}
              label={word}
              variant="selected"
              disabled={disabled}
              onClick={() => moveToAvailable(i)}
            />
          ))
        )}
      </div>

      {/* Available word chips */}
      <div className="flex flex-wrap gap-2 min-h-[48px]" aria-label="Доступные слова">
        {available.map((word, i) => (
          <Chip
            key={`avail-${i}-${word}`}
            label={word}
            variant="available"
            disabled={disabled}
            onClick={() => moveToSelected(i)}
          />
        ))}
      </div>

      {/* Submit */}
      <Button
        type="button"
        disabled={disabled || selected.length === 0}
        onClick={handleSubmit}
        className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-primary] text-white hover:bg-[--color-primary]/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Ответить
      </Button>
    </div>
  )
}
