'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startTask, submitTask } from '@/server/actions/tasks'
import type { TaskBundle, TaskResult } from '@/server/actions/tasks'
import type { TaskItemClient } from '@/server/content/types'
import { LevelSelect } from '@/components/minigames/shared/LevelSelect'
import { QuestionRunner } from '@/components/minigames/shared/QuestionRunner'
import { ResultScreen } from '@/components/minigames/shared/ResultScreen'
import { MultipleChoiceItem } from '@/components/minigames/math/MultipleChoiceItem'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'select' | 'playing' | 'result'

interface Answer {
  itemId: string
  answer: string
}

// ---------------------------------------------------------------------------
// Item router
// ---------------------------------------------------------------------------

function renderItem(
  item: TaskItemClient,
  onAnswer: (answer: string) => void,
  disabled: boolean,
): React.ReactNode {
  switch (item.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceItem
          options={item.options ?? []}
          onSelect={onAnswer}
          disabled={disabled}
        />
      )

    case 'text_input':
    case 'true_false':
    case 'match_pairs':
    case 'fill_blank':
      return (
        <p className="text-[--color-foreground] opacity-60 text-center text-base p-4">
          Тип задания появится позже.
        </p>
      )

    default: {
      const _exhaustive: never = item
      void _exhaustive
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// EnglishGame
// ---------------------------------------------------------------------------

export function EnglishGame({
  initialLevel,
  completedLevels,
}: {
  initialLevel: number
  completedLevels: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ---- phase state ----
  const [phase, setPhase] = useState<Phase>('select')
  const [currentLevel, setCurrentLevel] = useState(initialLevel)
  const [completedCount, setCompletedCount] = useState(completedLevels)

  // ---- session state ----
  const [bundle, setBundle] = useState<TaskBundle | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [answerLocked, setAnswerLocked] = useState(false)

  // ---- result state ----
  const [result, setResult] = useState<TaskResult | null>(null)

  // ---- handlers ----

  const handleStart = useCallback(
    (level: number) => {
      startTransition(async () => {
        const b = await startTask({ subject: 'ENGLISH', level })
        setBundle(b)
        setCurrentIndex(0)
        setAnswers([])
        setLastAnswerCorrect(null)
        setAnswerLocked(false)
        setPhase('playing')
      })
    },
    [],
  )

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!bundle || answerLocked) return
      const item = bundle.items[currentIndex]
      if (!item) return

      setAnswerLocked(true)

      const newAnswers: Answer[] = [...answers, { itemId: item.id, answer }]
      setAnswers(newAnswers)

      const isLast = currentIndex >= bundle.items.length - 1

      // Flash feedback — determine correctness client-side for the animation
      // (real grading still happens server-side via submitTask)
      // We don't have correct on client, so just show neutral green for now
      setLastAnswerCorrect(true)

      setTimeout(() => {
        if (isLast) {
          // Submit all answers
          startTransition(async () => {
            const res = await submitTask({
              sessionToken: bundle.sessionToken,
              answers: newAnswers,
            })
            setResult(res)
            if (res.passed) {
              setCompletedCount((c) => c + 1)
            }
            setLastAnswerCorrect(null)
            setPhase('result')
          })
        } else {
          setCurrentIndex((i) => i + 1)
          setLastAnswerCorrect(null)
          setAnswerLocked(false)
        }
      }, 600)
    },
    [bundle, currentIndex, answers, answerLocked],
  )

  const handleNextLevel = useCallback(() => {
    if (!result) return
    const next = result.passed
      ? Math.min(currentLevel + 1, 10)
      : currentLevel
    setCurrentLevel(next)
    setResult(null)
    setBundle(null)
    setPhase('select')
  }, [result, currentLevel])

  const handleExit = useCallback(() => {
    router.refresh()
    router.push('/play')
  }, [router])

  // ---- render ----

  if (phase === 'select') {
    return (
      <LevelSelect
        subjectLabel="Английский"
        currentLevel={currentLevel}
        completedLevels={completedCount}
        onStart={handleStart}
        onExit={handleExit}
        loading={isPending}
      />
    )
  }

  if (phase === 'result' && result) {
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
        loading={isPending}
      />
    )
  }

  if (!bundle) return null

  const item: TaskItemClient | undefined = bundle.items[currentIndex]
  if (!item) return null

  // Determine prompt shown in the QuestionRunner header card
  const runnerPrompt = item.prompt

  return (
    <QuestionRunner
      currentIndex={currentIndex}
      totalCount={bundle.items.length}
      lastAnswerCorrect={lastAnswerCorrect}
      promptText={runnerPrompt}
    >
      {renderItem(item, handleAnswer, answerLocked || isPending)}
    </QuestionRunner>
  )
}
