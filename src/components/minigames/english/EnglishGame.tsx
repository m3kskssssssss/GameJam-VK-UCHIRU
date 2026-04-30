'use client'

import { useState, useCallback, useTransition } from 'react'
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

type Phase = 'select' | 'playing' | 'result'

interface Answer {
  itemId: string
  answer: string
}

interface EnglishGameProps {
  initialLevel: number
  completedLevels: number
  grade: number
}

export function EnglishGame({ initialLevel, completedLevels, grade }: EnglishGameProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [phase, setPhase] = useState<Phase>('select')
  const [currentLevel, setCurrentLevel] = useState(initialLevel)
  const [completedCount, setCompletedCount] = useState(completedLevels)

  const [bundle, setBundle] = useState<TaskBundle | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [answerLocked, setAnswerLocked] = useState(false)

  const [result, setResult] = useState<TaskResult | null>(null)

  const handleStart = useCallback(
    (level: number) => {
      startTransition(async () => {
        const b = await startTask({ subject: 'ENGLISH', grade, level })
        setBundle(b)
        setCurrentIndex(0)
        setAnswers([])
        setLastAnswerCorrect(null)
        setAnswerLocked(false)
        setPhase('playing')
      })
    },
    [grade],
  )

  const handleAnswer = useCallback(
    (value: AnswerValue, isCorrect: boolean) => {
      if (!bundle || answerLocked) return
      const item = bundle.items[currentIndex]
      if (!item) return

      setAnswerLocked(true)
      setLastAnswerCorrect(isCorrect)

      const newAnswers: Answer[] = [
        ...answers,
        { itemId: item.id, answer: serializeAnswer(value) },
      ]
      setAnswers(newAnswers)

      const isLast = currentIndex >= bundle.items.length - 1

      setTimeout(() => {
        if (isLast) {
          startTransition(async () => {
            const res = await submitTask({
              sessionToken: bundle.sessionToken,
              answers: newAnswers,
            })
            setResult(res)
            if (res.passed) setCompletedCount((c) => c + 1)
            setLastAnswerCorrect(null)
            setPhase('result')
          })
        } else {
          setCurrentIndex((i) => i + 1)
          setLastAnswerCorrect(null)
          setAnswerLocked(false)
        }
      }, 700)
    },
    [bundle, currentIndex, answers, answerLocked],
  )

  const handleNextLevel = useCallback(() => {
    if (!result) return
    const next = result.passed ? Math.min(currentLevel + 1, 10) : currentLevel
    setCurrentLevel(next)
    setResult(null)
    setBundle(null)
    setPhase('select')
  }, [result, currentLevel])

  const handleExit = useCallback(() => {
    router.refresh()
    router.push('/play')
  }, [router])

  if (phase === 'select') {
    return (
      <LevelSelect
        subjectLabel="Английский"
        currentLevel={currentLevel}
        completedLevels={completedCount}
        grade={grade}
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

  const item = bundle.items[currentIndex]
  if (!item) return null

  return (
    <QuestionRunner
      currentIndex={currentIndex}
      totalCount={bundle.items.length}
      lastAnswerCorrect={lastAnswerCorrect}
      promptText={item.prompt}
    >
      <TaskItemRenderer
        task={item}
        disabled={answerLocked || isPending}
        onAnswer={handleAnswer}
      />
    </QuestionRunner>
  )
}
