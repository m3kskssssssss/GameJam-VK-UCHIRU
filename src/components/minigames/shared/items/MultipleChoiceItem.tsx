'use client'

import { useState } from 'react'
import type { MultipleChoiceTask } from '@/server/content/types'

interface Props {
  task: MultipleChoiceTask
  disabled: boolean
  onAnswer: (value: string, isCorrect: boolean) => void
}

export function MultipleChoiceItem({ task, disabled, onAnswer }: Props) {
  const [picked, setPicked] = useState<string | null>(null)

  function handleClick(option: string) {
    if (disabled || picked !== null) return
    setPicked(option)
    const isCorrect = option === task.correct
    onAnswer(option, isCorrect)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {task.options.map((option) => {
          const isPicked = picked === option
          const isCorrectPick = isPicked && option === task.correct
          const isWrongPick = isPicked && option !== task.correct
          const isCorrectAnswer = picked !== null && option === task.correct

          // Inline styles guarantee colours render even when tailwind-merge
          // strips arbitrary CSS-var classes (TW v4 + tailwind-merge v2 mismatch).
          let style: React.CSSProperties = {
            backgroundColor: '#F1ECE2',
            borderColor: '#C9C0AE',
            color: '#1F2937',
          }
          if (isCorrectPick) {
            style = { backgroundColor: '#6BCB77', borderColor: '#4CAA56', color: '#FFFFFF' }
          } else if (isWrongPick) {
            style = { backgroundColor: '#FF6B6B', borderColor: '#D94F4F', color: '#FFFFFF' }
          } else if (isCorrectAnswer) {
            style = { backgroundColor: '#D7F2D9', borderColor: '#6BCB77', color: '#1F2937' }
          } else if (picked !== null) {
            style = { backgroundColor: '#F1ECE2', borderColor: '#C9C0AE', color: '#1F2937', opacity: 0.5 }
          }

          return (
            <button
              key={option}
              type="button"
              disabled={disabled || picked !== null}
              onClick={() => handleClick(option)}
              style={style}
              className="
                min-h-[56px] w-full rounded-[0.75rem] border-2 px-4 py-3
                font-semibold text-lg
                active:scale-[0.97]
                transition-all duration-150
                disabled:cursor-not-allowed cursor-pointer
              "
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
