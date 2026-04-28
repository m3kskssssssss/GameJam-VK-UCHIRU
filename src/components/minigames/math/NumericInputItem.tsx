'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NumericInputItemProps {
  onSubmit: (answer: string) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Keypad digits layout
// ---------------------------------------------------------------------------

const PAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', '–']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NumericInputItem({ onSubmit, disabled = false }: NumericInputItemProps) {
  const [value, setValue] = useState('')

  function handleKey(key: string) {
    if (disabled) return
    if (key === '⌫') {
      setValue((v) => v.slice(0, -1))
      return
    }
    if (key === '–') {
      // Toggle negative sign
      setValue((v) => (v.startsWith('-') ? v.slice(1) : `-${v}`))
      return
    }
    // Guard: max 6 digits (enough for any school-level math)
    if (value.replace('-', '').length >= 6) return
    setValue((v) => v + key)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value || value === '-') return
    onSubmit(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
      {/* Display */}
      <div
        className="
          w-full max-w-xs rounded-[0.75rem]
          border-2 border-[--color-border] focus-within:border-[--color-primary]
          bg-[--color-muted] px-5 py-4
          flex items-center justify-end
          transition-colors duration-150
        "
      >
        <span
          className="text-[28px] font-bold text-[--color-foreground] tracking-widest min-h-[36px]"
          aria-live="polite"
        >
          {value || <span className="opacity-30">0</span>}
        </span>
      </div>

      {/* On-screen keypad */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {PAD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => handleKey(key)}
            className="
              h-[52px] rounded-[0.75rem]
              bg-[--color-muted] border border-[--color-border]
              text-[--color-foreground] font-semibold text-xl
              hover:bg-[--color-primary] hover:text-white hover:border-[--color-primary]
              active:scale-[0.95]
              transition-colors duration-100
              disabled:opacity-40 disabled:cursor-not-allowed
              cursor-pointer
            "
          >
            {key}
          </button>
        ))}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={disabled || !value || value === '-'}
        className="
          w-full max-w-xs min-h-[56px] text-base font-semibold rounded-[0.75rem]
          bg-[--color-primary] text-white
          hover:bg-[--color-primary]/90
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        Ответить
      </Button>
    </form>
  )
}
