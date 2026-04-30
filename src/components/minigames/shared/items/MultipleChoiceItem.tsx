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

          let stateClasses =
            'bg-[--color-muted] border-[--color-border] text-[--color-foreground] hover:bg-[--color-primary] hover:text-white hover:border-[--color-primary]'
          if (isCorrectPick) {
            stateClasses = 'bg-[#6BCB77] border-[#4CAA56] text-white'
          } else if (isWrongPick) {
            stateClasses = 'bg-[#FF6B6B] border-[#D94F4F] text-white'
          } else if (picked !== null && isCorrectAnswer) {
            stateClasses = 'bg-[#6BCB77]/40 border-[#6BCB77] text-[--color-foreground]'
          } else if (picked !== null) {
            stateClasses = 'bg-[--color-muted] border-[--color-border] text-[--color-foreground] opacity-50'
          }

          return (
            <button
              key={option}
              type="button"
              disabled={disabled || picked !== null}
              onClick={() => handleClick(option)}
              className={`
                min-h-[56px] w-full rounded-[0.75rem] border-2 px-4 py-3
                font-semibold text-lg
                active:scale-[0.97]
                transition-all duration-150
                disabled:cursor-not-allowed cursor-pointer
                ${stateClasses}
              `}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
