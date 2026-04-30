'use client'

import { useState, useRef, useEffect } from 'react'
import type { TextInputTask } from '@/server/content/types'
import { isAnswerCorrect } from '@/server/content/types'

interface Props {
  task: TextInputTask
  disabled: boolean
  onAnswer: (value: string, isCorrect: boolean) => void
}

export function TextInputItem({ task, disabled, onAnswer }: Props) {
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
    const correct = isAnswerCorrect(task, trimmed)
    onAnswer(trimmed, correct)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const isCorrect = submitted && isAnswerCorrect(task, value.trim())
  const inputBorderColor = submitted
    ? isCorrect
      ? 'border-[#6BCB77] bg-[#6BCB77]/10'
      : 'border-[#FF6B6B] bg-[#FF6B6B]/10'
    : 'border-[--color-border] bg-[--color-background]'

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      <input
        ref={inputRef}
        type="text"
        inputMode={task.inputMode === 'numeric' ? 'numeric' : 'text'}
        value={value}
        disabled={disabled || submitted}
        placeholder={task.inputMode === 'numeric' ? 'Введи число' : 'Введи ответ'}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`
          w-full min-h-[64px] rounded-[0.75rem] border-2 px-4 py-3
          text-2xl font-semibold text-center text-[--color-foreground]
          outline-none transition-colors duration-150
          focus:border-[--color-primary]
          disabled:cursor-not-allowed
          ${inputBorderColor}
        `}
      />
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
          style={{ backgroundColor: '#4DA8DA', color: '#FFFFFF' }}
          className="
            w-full min-h-[56px] rounded-[0.75rem]
            text-lg font-extrabold shadow-md
            hover:brightness-95 active:scale-[0.97]
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
