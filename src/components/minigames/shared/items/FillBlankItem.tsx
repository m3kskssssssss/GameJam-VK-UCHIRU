'use client'

import { useState, useRef, useEffect } from 'react'
import type { FillBlankTask } from '@/server/content/types'
import { isAnswerCorrect } from '@/server/content/types'

interface Props {
  task: FillBlankTask
  disabled: boolean
  onAnswer: (value: string, isCorrect: boolean) => void
}

export function FillBlankItem({ task, disabled, onAnswer }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [task.id])

  function submit() {
    if (disabled || submitted) return
    const trimmed = value.trim()
    if (!trimmed) return
    setSubmitted(true)
    onAnswer(trimmed, isAnswerCorrect(task, trimmed))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const isCorrect = submitted && isAnswerCorrect(task, value.trim())
  const inputBorder = submitted
    ? isCorrect
      ? 'border-[#6BCB77] bg-[#6BCB77]/10'
      : 'border-[#FF6B6B] bg-[#FF6B6B]/10'
    : 'border-[--color-border] bg-[--color-background]'

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      <div className="rounded-[1rem] bg-[--color-muted] border border-[--color-border] p-5 text-center">
        <p className="text-[20px] leading-relaxed text-[--color-foreground]">
          <span>{task.before} </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled || submitted}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`
              inline-block min-w-[120px] max-w-[200px]
              border-b-2 outline-none
              text-[20px] font-bold text-center text-[--color-foreground]
              transition-colors duration-150
              focus:border-[--color-primary]
              disabled:cursor-not-allowed
              ${inputBorder}
            `}
            style={{
              backgroundColor: 'transparent',
              borderRadius: 0,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
            }}
          />
          <span> {task.after}</span>
        </p>
      </div>
      {submitted && !isCorrect && (
        <p className="text-center text-base text-[--color-foreground] opacity-80">
          Правильный ответ: <span className="font-bold">{task.correct}</span>
        </p>
      )}
      {!submitted && (
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={submit}
          className="
            w-full min-h-[56px] rounded-[0.75rem] bg-[--color-primary] text-white
            text-lg font-semibold
            hover:bg-[--color-primary]/90 active:scale-[0.97]
            disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
            transition-all duration-150
          "
        >
          Ответить
        </button>
      )}
    </div>
  )
}
