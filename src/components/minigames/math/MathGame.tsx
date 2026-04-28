'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startTask, submitTask } from '@/server/actions/tasks'
import type { TaskBundle, TaskResult } from '@/server/actions/tasks'
import type { TaskItemClient } from '@/server/content/types'
import { LevelSelect } from '@/components/minigames/shared/LevelSelect'
import { QuestionRunner } from '@/components/minigames/shared/QuestionRunner'
import { ResultScreen } from '@/components/minigames/shared/ResultScreen'
import { MultipleChoiceItem } from './MultipleChoiceItem'
import { NumericInputItem } from './NumericInputItem'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MathGameProps {
  initialLevel: number
  completedLevels: number
}

type GameState =
  | { phase: 'select' }
  | { phase: 'loading' }
  | { phase: 'running'; bundle: TaskBundle; currentIndex: number; answers: { itemId: string; answer: string }[] }
  | { phase: 'submitting' }
  | { phase: 'result'; result: TaskResult }
  | { phase: 'error'; message: string }

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background]">
      <div className="w-12 h-12 rounded-full border-4 border-[--color-border] border-t-[--color-primary] animate-spin" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MathGame
// ---------------------------------------------------------------------------

export function MathGame({ initialLevel, completedLevels }: MathGameProps) {
  const router = useRouter()

  const [levelCursor, setLevelCursor] = useState(initialLevel)
  const [completedCount, setCompletedCount] = useState(completedLevels)
  const [state, setState] = useState<GameState>({ phase: 'select' })

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  async function handleStart(level: number) {
    setState({ phase: 'loading' })
    try {
      const bundle = await startTask({ subject: 'MATH', level })
      setState({ phase: 'running', bundle, currentIndex: 0, answers: [] })
    } catch {
      setState({ phase: 'error', message: 'Не удалось загрузить задание. Попробуй ещё раз.' })
    }
  }

  function handleAnswer(answer: string) {
    if (state.phase !== 'running') return

    const item = state.bundle.items[state.currentIndex]
    if (!item) return

    const newAnswers = [...state.answers, { itemId: item.id, answer }]
    const nextIndex = state.currentIndex + 1

    if (nextIndex >= state.bundle.items.length) {
      // All items answered — submit
      void handleSubmit(state.bundle.sessionToken, newAnswers)
    } else {
      setState({ phase: 'running', bundle: state.bundle, currentIndex: nextIndex, answers: newAnswers })
    }
  }

  async function handleSubmit(
    sessionToken: string,
    answers: { itemId: string; answer: string }[],
  ) {
    setState({ phase: 'submitting' })
    try {
      const result = await submitTask({ sessionToken, answers })
      if (result.passed) {
        setLevelCursor(result.newLevel)
        setCompletedCount((c) => c + 1)
      }
      setState({ phase: 'result', result })
    } catch {
      setState({ phase: 'error', message: 'Не удалось отправить ответы. Попробуй ещё раз.' })
    }
  }

  function handleNextLevel() {
    router.refresh()
    setState({ phase: 'loading' })
    void handleStart(levelCursor)
  }

  function handleExit() {
    router.refresh()
    router.push('/play')
  }

  function handleRetryFromError() {
    setState({ phase: 'select' })
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderAnswerComponent(item: TaskItemClient, disabled: boolean) {
    switch (item.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceItem
            options={item.options ?? []}
            onSelect={handleAnswer}
            disabled={disabled}
          />
        )
      case 'numeric_input':
        return (
          <NumericInputItem
            onSubmit={handleAnswer}
            disabled={disabled}
          />
        )
      case 'arrange':
      case 'listen_choose':
        // Math content does not use these types; fall back to a safe placeholder
        return (
          <p className="text-[--color-foreground] opacity-60">
            Неподдерживаемый тип вопроса: {item.type}
          </p>
        )
      default: {
        // Exhaustive check — TypeScript will flag unhandled TaskItemType values
        const _unreachable: never = item.type
        return (
          <p className="text-[--color-foreground] opacity-60">
            Неизвестный тип вопроса: {String(_unreachable)}
          </p>
        )
      }
    }
  }

  // -------------------------------------------------------------------------
  // State machine render
  // -------------------------------------------------------------------------

  if (state.phase === 'select') {
    return (
      <LevelSelect
        subjectLabel="Математика"
        currentLevel={levelCursor}
        completedLevels={completedCount}
        onStart={handleStart}
        onExit={handleExit}
      />
    )
  }

  if (state.phase === 'loading') {
    return <Spinner />
  }

  if (state.phase === 'running') {
    const { bundle, currentIndex } = state
    const item = bundle.items[currentIndex]

    if (!item) return <Spinner />

    return (
      <QuestionRunner
        currentIndex={currentIndex}
        totalCount={bundle.items.length}
        lastAnswerCorrect={null}
        promptText={item.prompt}
      >
        {renderAnswerComponent(item, false)}
      </QuestionRunner>
    )
  }

  if (state.phase === 'submitting') {
    return <Spinner />
  }

  if (state.phase === 'result') {
    const { result } = state
    return (
      <ResultScreen
        passed={result.passed}
        correctCount={result.correctCount}
        totalCount={result.totalCount}
        coinsEarned={result.coinsEarned}
        energyEarned={result.energyEarned}
        xpEarned={result.xpEarned}
        newLevel={result.newLevel}
        onNextLevel={handleNextLevel}
        onExit={handleExit}
      />
    )
  }

  // phase === 'error'
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background] p-4">
      <div
        className="w-full max-w-sm rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-8 flex flex-col items-center gap-6"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
      >
        <p className="text-lg font-semibold text-[--color-foreground] text-center">
          {state.message}
        </p>
        <Button
          onClick={handleRetryFromError}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-primary] text-white hover:bg-[--color-primary]/90 cursor-pointer"
        >
          Попробовать снова
        </Button>
        <Button
          variant="ghost"
          onClick={handleExit}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-muted] text-[--color-foreground] hover:bg-[--color-border] cursor-pointer"
        >
          Выйти из домика
        </Button>
      </div>
    </div>
  )
}
