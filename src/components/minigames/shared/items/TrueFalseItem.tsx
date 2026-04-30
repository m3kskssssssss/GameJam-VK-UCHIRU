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

  function btnStyle(forValue: boolean): React.CSSProperties {
    const isPicked = picked === forValue
    const isCorrectPick = isPicked && forValue === task.correct
    const isWrongPick = isPicked && forValue !== task.correct

    if (isCorrectPick) return { backgroundColor: '#6BCB77', borderColor: '#4CAA56', color: '#FFFFFF' }
    if (isWrongPick) return { backgroundColor: '#FF6B6B', borderColor: '#D94F4F', color: '#FFFFFF' }
    if (picked !== null && forValue === task.correct) {
      return { backgroundColor: '#D7F2D9', borderColor: '#6BCB77', color: '#1F2937' }
    }
    if (picked !== null) {
      return { backgroundColor: '#F1ECE2', borderColor: '#C9C0AE', color: '#1F2937', opacity: 0.5 }
    }
    return { backgroundColor: '#F1ECE2', borderColor: '#C9C0AE', color: '#1F2937' }
  }

  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-4">
      <button
        type="button"
        disabled={disabled || picked !== null}
        onClick={() => handlePick(true)}
        style={btnStyle(true)}
        className="
          min-h-[88px] rounded-[0.75rem] border-2 px-4 py-3
          font-extrabold text-2xl
          active:scale-[0.97]
          transition-all duration-150
          disabled:cursor-not-allowed cursor-pointer
        "
      >
        ✓ Да
      </button>
      <button
        type="button"
        disabled={disabled || picked !== null}
        onClick={() => handlePick(false)}
        style={btnStyle(false)}
        className="
          min-h-[88px] rounded-[0.75rem] border-2 px-4 py-3
          font-extrabold text-2xl
          active:scale-[0.97]
          transition-all duration-150
          disabled:cursor-not-allowed cursor-pointer
        "
      >
        ✗ Нет
      </button>
    </div>
  )
}
