'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { startTask, submitTask } from '@/server/actions/tasks'
import type { TaskItemClient, AnswerValue } from '@/server/content/types'
import { LevelSelect } from '@/components/minigames/shared/LevelSelect'
import { QuestionRunner } from '@/components/minigames/shared/QuestionRunner'
import { ResultScreen } from '@/components/minigames/shared/ResultScreen'
import {
  TaskItemRenderer,
  serializeAnswer,
} from '@/components/minigames/shared/items/TaskItemRenderer'
import { PassageViewer } from './PassageViewer'

interface ReadingGameProps {
  initialLevel: number
  completedLevels: number
  grade: number
}

type Phase = 'select' | 'playing' | 'result'

interface Answer {
  itemId: string
  answer: string
}

interface ResultData {
  passed: boolean
  correctCount: number
  totalCount: number
  coinsEarned: number
  energyEarned: number
  xpEarned: number
  newLevel: number
}

// Reading items with passages embed text in the prompt as:
//   Текст: "...passage..."\n\nQuestion text here?
// Other types (text_input, true_false, etc.) just have a plain prompt.
const PASSAGE_REGEX = /^Текст:\s*"([^"]+)"\s*\n\n(.+)$/s

function splitPrompt(prompt: string): { passage: string; question: string } {
  const match = PASSAGE_REGEX.exec(prompt)
  if (match) {
    return { passage: match[1] ?? '', question: match[2] ?? prompt }
  }
  return { passage: '', question: prompt }
}

export function ReadingGame({ initialLevel, completedLevels, grade }: ReadingGameProps) {
  const router = useRouter()

  const [phase, setPhase] = React.useState<Phase>('select')
  const [level, setLevel] = React.useState(initialLevel)
  const [completedCount, setCompletedCount] = React.useState(completedLevels)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [sessionToken, setSessionToken] = React.useState<string>('')
  const [items, setItems] = React.useState<TaskItemClient[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<Answer[]>([])
  const [lastAnswerCorrect, setLastAnswerCorrect] = React.useState<boolean | null>(null)
  const [answerLocked, setAnswerLocked] = React.useState(false)
  const [result, setResult] = React.useState<ResultData | null>(null)

  const handleStart = React.useCallback(
    async (lvl: number) => {
      setLoading(true)
      setError(null)
      try {
        const bundle = await startTask({ subject: 'READING', grade, level: lvl })
        setSessionToken(bundle.sessionToken)
        setItems(bundle.items)
        setCurrentIndex(0)
        setAnswers([])
        setLastAnswerCorrect(null)
        setAnswerLocked(false)
        setResult(null)
        setLevel(lvl)
        setPhase('playing')
      } catch {
        setError('Не удалось загрузить задание. Попробуй ещё раз.')
      } finally {
        setLoading(false)
      }
    },
    [grade],
  )

  const handleAnswer = React.useCallback(
    (value: AnswerValue, isCorrect: boolean) => {
      const item = items[currentIndex]
      if (!item || answerLocked) return

      setAnswerLocked(true)
      setLastAnswerCorrect(isCorrect)

      const newAnswers: Answer[] = [
        ...answers,
        { itemId: item.id, answer: serializeAnswer(value) },
      ]
      setAnswers(newAnswers)

      const isLast = currentIndex >= items.length - 1

      setTimeout(() => {
        if (isLast) {
          setLoading(true)
          submitTask({ sessionToken, answers: newAnswers })
            .then((res) => {
              setResult(res)
              if (res.passed) setCompletedCount((c) => c + 1)
              setLastAnswerCorrect(null)
              setPhase('result')
            })
            .catch(() => {
              setError('Не удалось сохранить результат. Попробуй ещё раз.')
              setPhase('select')
            })
            .finally(() => setLoading(false))
        } else {
          setCurrentIndex((i) => i + 1)
          setLastAnswerCorrect(null)
          setAnswerLocked(false)
        }
      }, 700)
    },
    [answers, currentIndex, items, sessionToken, answerLocked],
  )

  const handleNextLevel = React.useCallback(() => {
    const nextLevel = result?.passed ? Math.min(level + 1, 10) : level
    setPhase('select')
    setLevel(nextLevel)
    setResult(null)
  }, [level, result])

  const handleExit = React.useCallback(() => {
    router.refresh()
    router.push('/play')
  }, [router])

  const currentItem = items[currentIndex]
  const parsed = currentItem ? splitPrompt(currentItem.prompt) : { passage: '', question: '' }

  if (phase === 'select') {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-0 right-0 flex justify-center z-50 px-4">
            <div className="rounded-[0.75rem] bg-[#FF6B6B] text-white px-5 py-3 text-base font-semibold shadow-lg">
              {error}
            </div>
          </div>
        )}
        <LevelSelect
          subjectLabel="Чтение"
          currentLevel={level}
          completedLevels={completedCount}
          grade={grade}
          onStart={handleStart}
          onExit={handleExit}
          loading={loading}
        />
      </>
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
        loading={loading}
      />
    )
  }

  if (phase === 'playing' && currentItem) {
    return (
      <div className="relative min-h-dvh flex flex-col bg-[--color-background]">
        <QuestionRunner
          currentIndex={currentIndex}
          totalCount={items.length}
          lastAnswerCorrect={lastAnswerCorrect}
          promptText={parsed.passage ? parsed.question : currentItem.prompt}
        >
          {parsed.passage ? (
            <div className="w-full max-w-md mx-auto flex flex-col gap-4">
              <PassageViewer text={parsed.passage} />
              <TaskItemRenderer
                task={currentItem}
                disabled={answerLocked || loading}
                onAnswer={handleAnswer}
              />
            </div>
          ) : (
            <TaskItemRenderer
              task={currentItem}
              disabled={answerLocked || loading}
              onAnswer={handleAnswer}
            />
          )}
        </QuestionRunner>

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-[--color-background]/70 z-50">
            <p className="text-lg font-semibold text-[--color-foreground]">Загрузка...</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
