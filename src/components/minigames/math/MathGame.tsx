'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { startTask, submitTask } from '@/server/actions/tasks'
import type { TaskBundle, TaskResult } from '@/server/actions/tasks'
import type { AnswerValue } from '@/server/content/types'
import { LevelSelect } from '@/components/minigames/shared/LevelSelect'
import { QuestionRunner } from '@/components/minigames/shared/QuestionRunner'
import { ResultScreen } from '@/components/minigames/shared/ResultScreen'
import {
  TaskItemRenderer,
  serializeAnswer,
} from '@/components/minigames/shared/items/TaskItemRenderer'
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MathGameProps {
  initialLevel: number
  completedLevels: number
  grade: number
}

type GameState =
  | { phase: 'select' }
  | { phase: 'loading' }
  | {
      phase: 'running'
      bundle: TaskBundle
      currentIndex: number
      answers: { itemId: string; answer: string }[]
      lastAnswerCorrect: boolean | null
      answerLocked: boolean
    }
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

export function MathGame({ initialLevel, completedLevels, grade }: MathGameProps) {
  const router = useRouter()

  const [levelCursor, setLevelCursor] = useState(initialLevel)
  const [completedCount, setCompletedCount] = useState(completedLevels)
  const [state, setState] = useState<GameState>({ phase: 'select' })

  const handleStart = useCallback(
    async (level: number) => {
      setState({ phase: 'loading' })
      try {
        const bundle = await startTask({ subject: 'MATH', grade, level })
        setState({
          phase: 'running',
          bundle,
          currentIndex: 0,
          answers: [],
          lastAnswerCorrect: null,
          answerLocked: false,
        })
      } catch {
        setState({ phase: 'error', message: 'Не удалось загрузить задание. Попробуй ещё раз.' })
      }
    },
    [grade],
  )

  const handleAnswer = useCallback(
    (value: AnswerValue, isCorrect: boolean) => {
      setState((prev) => {
        if (prev.phase !== 'running' || prev.answerLocked) return prev
        const item = prev.bundle.items[prev.currentIndex]
        if (!item) return prev

        const answer = serializeAnswer(value)
        const newAnswers = [...prev.answers, { itemId: item.id, answer }]
        return {
          ...prev,
          answers: newAnswers,
          lastAnswerCorrect: isCorrect,
          answerLocked: true,
        }
      })

      // Advance after the flash animation.
      setTimeout(() => {
        setState((prev) => {
          if (prev.phase !== 'running') return prev
          const nextIndex = prev.currentIndex + 1
          if (nextIndex >= prev.bundle.items.length) {
            // Submit
            void handleSubmit(prev.bundle.sessionToken, prev.answers)
            return { phase: 'submitting' as const }
          }
          return {
            ...prev,
            currentIndex: nextIndex,
            lastAnswerCorrect: null,
            answerLocked: false,
          }
        })
      }, 700)
    },
    [],
  )

  async function handleSubmit(
    sessionToken: string,
    answers: { itemId: string; answer: string }[],
  ) {
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

  if (state.phase === 'select') {
    return (
      <LevelSelect
        subjectLabel="Математика"
        currentLevel={levelCursor}
        completedLevels={completedCount}
        grade={grade}
        onStart={handleStart}
        onExit={handleExit}
      />
    )
  }

  if (state.phase === 'loading') return <Spinner />

  if (state.phase === 'running') {
    const { bundle, currentIndex, lastAnswerCorrect, answerLocked } = state
    const item = bundle.items[currentIndex]
    if (!item) return <Spinner />

    return (
      <QuestionRunner
        currentIndex={currentIndex}
        totalCount={bundle.items.length}
        lastAnswerCorrect={lastAnswerCorrect}
        promptText={item.prompt}
      >
        <TaskItemRenderer
          task={item}
          disabled={answerLocked}
          onAnswer={handleAnswer}
        />
      </QuestionRunner>
    )
  }

  if (state.phase === 'submitting') return <Spinner />

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

  // error
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-background] p-4">
      <div
        className="w-full max-w-sm rounded-[1rem] border border-[--color-border] bg-[--color-muted] p-8 flex flex-col items-center gap-6"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
      >
        <p className="text-lg font-semibold text-[--color-foreground] text-center">
          {state.message}
        </p>
        <button
          type="button"
          onClick={handleRetryFromError}
          style={{ backgroundColor: '#4DA8DA', color: '#FFFFFF' }}
          className="w-full min-h-[56px] text-base font-extrabold rounded-[0.75rem] cursor-pointer shadow-md hover:brightness-95 active:scale-[0.98] transition-all"
        >
          Попробовать снова
        </button>
        <button
          type="button"
          onClick={handleExit}
          style={{ backgroundColor: '#FFF9F0', color: '#1F2937', borderColor: '#C9C0AE' }}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] border-2 cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all"
        >
          Выйти из домика
        </button>
      </div>
    </div>
  )
}
