'use client'

import { useState } from 'react'
import type { TrueFalseTask } from '@/server/content/types'

interface Props {
  task: TrueFalseTask
  disabled: boolean
  onAnswer: (value: boolean, isCorrect: boolean) => void
}

export function TrueFalseItem({ task, disabled, onAnswer }: Props) {
  const [picked, setPicked] = useState<boolean | null>(null)

  function handlePick(value: boolean) {
    if (disabled || picked !== null) return
    setPicked(value)
    onAnswer(value, value === task.correct)
  }

  function btnClasses(forValue: boolean): string {
    const isPicked = picked === forValue
    const isCorrectPick = isPicked && forValue === task.correct
    const isWrongPick = isPicked && forValue !== task.correct

    if (isCorrectPick) return 'bg-[#6BCB77] border-[#4CAA56] text-white'
    if (isWrongPick) return 'bg-[#FF6B6B] border-[#D94F4F] text-white'
    if (picked !== null && forValue === task.correct) {
      return 'bg-[#6BCB77]/40 border-[#6BCB77] text-[--color-foreground]'
    }
    if (picked !== null) {
      return 'bg-[--color-muted] border-[--color-border] text-[--color-foreground] opacity-50'
    }
    return forValue
      ? 'bg-[--color-muted] border-[--color-border] text-[--color-foreground] hover:bg-[#6BCB77] hover:text-white hover:border-[#4CAA56]'
      : 'bg-[--color-muted] border-[--color-border] text-[--color-foreground] hover:bg-[#FF6B6B] hover:text-white hover:border-[#D94F4F]'
  }

  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-4">
      <button
        type="button"
        disabled={disabled || picked !== null}
        onClick={() => handlePick(true)}
        className={`
          min-h-[88px] rounded-[0.75rem] border-2 px-4 py-3
          font-extrabold text-2xl
          active:scale-[0.97]
          transition-all duration-150
          disabled:cursor-not-allowed cursor-pointer
          ${btnClasses(true)}
        `}
      >
        ✓ Да
      </button>
      <button
        type="button"
        disabled={disabled || picked !== null}
        onClick={() => handlePick(false)}
        className={`
          min-h-[88px] rounded-[0.75rem] border-2 px-4 py-3
          font-extrabold text-2xl
          active:scale-[0.97]
          transition-all duration-150
          disabled:cursor-not-allowed cursor-pointer
          ${btnClasses(false)}
        `}
      >
        ✗ Нет
      </button>
    </div>
  )
}
