'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { startTask, submitTask } from '@/server/actions/tasks'
import type { TaskItemClient } from '@/server/content/types'
import { LevelSelect } from '@/components/minigames/shared/LevelSelect'
import { QuestionRunner } from '@/components/minigames/shared/QuestionRunner'
import { ResultScreen } from '@/components/minigames/shared/ResultScreen'
import { MultipleChoiceItem } from '@/components/minigames/math/MultipleChoiceItem'
import { PassageViewer } from './PassageViewer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadingGameProps {
  initialLevel: number
  completedLevels: number
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

// ---------------------------------------------------------------------------
// Passage extraction
// ---------------------------------------------------------------------------

// Each reading item.prompt is shaped as:
//   Текст: "...passage..."\n\nQuestion text here?
// We extract passage and question from this shape.
// If the pattern is not found, the whole prompt is treated as the question.

const PASSAGE_REGEX = /^Текст:\s*"([^"]+)"\s*\n\n(.+)$/s

function splitPrompt(prompt: string): { passage: string; question: string } {
  const match = PASSAGE_REGEX.exec(prompt)
  if (match) {
    return { passage: match[1] ?? '', question: match[2] ?? prompt }
  }
  return { passage: '', question: prompt }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReadingGame({ initialLevel, completedLevels }: ReadingGameProps) {
  const router = useRouter()

  const [phase, setPhase] = React.useState<Phase>('select')
  const [level, setLevel] = React.useState(initialLevel)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Session state
  const [sessionToken, setSessionToken] = React.useState<string>('')
  const [items, setItems] = React.useState<TaskItemClient[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<Answer[]>([])
  const [lastAnswerCorrect, setLastAnswerCorrect] = React.useState<boolean | null>(null)
  const [result, setResult] = React.useState<ResultData | null>(null)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStart = React.useCallback(async (lvl: number) => {
    setLoading(true)
    setError(null)
    try {
      const bundle = await startTask({ subject: 'READING', level: lvl })
      setSessionToken(bundle.sessionToken)
      setItems(bundle.items)
      setCurrentIndex(0)
      setAnswers([])
      setLastAnswerCorrect(null)
      setResult(null)
      setLevel(lvl)
      setPhase('playing')
    } catch {
      setError('Не удалось загрузить задание. Попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAnswer = React.useCallback(
    (answer: string) => {
      const item = items[currentIndex]
      if (!item) return

      const newAnswers = [...answers, { itemId: item.id, answer }]
      setAnswers(newAnswers)

      // Optimistic flash — we can't know correctness client-side, so always
      // show neutral positive feedback to keep the child engaged.
      // We set null to trigger QuestionRunner's no-flash state, then advance.
      setLastAnswerCorrect(null)

      const isLast = currentIndex >= items.length - 1

      if (isLast) {
        // Submit all answers
        setLoading(true)
        submitTask({ sessionToken, answers: newAnswers })
          .then((res) => {
            setResult(res)
            setPhase('result')
          })
          .catch(() => {
            setError('Не удалось сохранить результат. Попробуй ещё раз.')
            setPhase('select')
          })
          .finally(() => setLoading(false))
      } else {
        setCurrentIndex((i) => i + 1)
      }
    },
    [answers, currentIndex, items, sessionToken],
  )

  const handleNextLevel = React.useCallback(() => {
    const nextLevel = Math.min(level + 1, 10)
    setPhase('select')
    setLevel(nextLevel)
  }, [level])

  const handleExit = React.useCallback(() => {
    router.refresh()
    router.push('/play')
  }, [router])

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const currentItem = items[currentIndex]
  const parsed = currentItem ? splitPrompt(currentItem.prompt) : { passage: '', question: '' }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
          completedLevels={completedLevels}
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
          promptText={parsed.question}
        >
          {/* Passage viewer sits inside the answer slot, above choices */}
          {parsed.passage ? (
            <div className="flex flex-col gap-4">
              <PassageViewer text={parsed.passage} />
              <MultipleChoiceItem
                options={currentItem.options ?? []}
                onSelect={handleAnswer}
                disabled={loading}
              />
            </div>
          ) : (
            <MultipleChoiceItem
              options={currentItem.options ?? []}
              onSelect={handleAnswer}
              disabled={loading}
            />
          )}
        </QuestionRunner>

        {/* Loading overlay when submitting final answer */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-[--color-background]/70 z-50">
            <p className="text-lg font-semibold text-[--color-foreground]">Загрузка...</p>
          </div>
        )}
      </div>
    )
  }

  // Fallback — should not be visible normally
  return null
}
