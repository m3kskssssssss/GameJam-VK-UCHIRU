'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startPESession, completePESession } from '@/server/actions/pe'
import type { PEResult } from '@/server/actions/pe'
import type { PEExercise } from '@/server/content/pe'
import { getPEExercise } from '@/server/content/pe'
import { ExercisePicker } from './ExercisePicker'
import { CameraSession } from './CameraSession'
import { ResultScreen } from '@/components/minigames/shared/ResultScreen'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PEGameProps {
  peSessionsCount: number
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type PEState =
  | { phase: 'picker' }
  | { phase: 'starting' }
  | { phase: 'session'; sessionId: string; exercise: PEExercise }
  | { phase: 'completing'; sessionId: string }
  | { phase: 'reward'; result: PEResult; sessionNumber: number }
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
// PEGame
// ---------------------------------------------------------------------------

export function PEGame({ peSessionsCount }: PEGameProps) {
  const router = useRouter()
  const [sessionCount, setSessionCount] = useState(peSessionsCount)
  const [state, setState] = useState<PEState>({ phase: 'picker' })

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  async function handlePick(exerciseKey: string) {
    setState({ phase: 'starting' })
    try {
      const { sessionId } = await startPESession({ exerciseKey })
      const exercise = getPEExercise(exerciseKey)
      setState({ phase: 'session', sessionId, exercise })
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'EXERCISE_NOT_FOUND'
          ? 'Упражнение не найдено. Попробуй выбрать другое.'
          : 'Не удалось начать упражнение. Попробуй ещё раз.'
      setState({ phase: 'error', message })
    }
  }

  async function handleSessionComplete() {
    if (state.phase !== 'session') return
    const { sessionId } = state
    setState({ phase: 'completing', sessionId })
    try {
      const result = await completePESession({ sessionId })
      const newCount = sessionCount + 1
      setSessionCount(newCount)
      setState({ phase: 'reward', result, sessionNumber: newCount })
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'ALREADY_COMPLETED'
          ? 'Эта сессия уже засчитана. Выбери новое упражнение!'
          : 'Не удалось завершить упражнение. Попробуй ещё раз.'
      setState({ phase: 'error', message })
    }
  }

  function handleAnotherExercise() {
    setState({ phase: 'picker' })
  }

  function handleExit() {
    router.refresh()
    router.push('/play')
  }

  function handleRetryFromError() {
    setState({ phase: 'picker' })
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (state.phase === 'picker') {
    return <ExercisePicker onPick={handlePick} />
  }

  if (state.phase === 'starting') {
    return <Spinner />
  }

  if (state.phase === 'session') {
    return (
      <CameraSession
        sessionId={state.sessionId}
        exercise={state.exercise}
        onComplete={handleSessionComplete}
      />
    )
  }

  if (state.phase === 'completing') {
    return <Spinner />
  }

  if (state.phase === 'reward') {
    const { result, sessionNumber } = state
    return (
      <ResultScreen
        passed={true}
        correctCount={1}
        totalCount={1}
        coinsEarned={result.coinsEarned}
        energyEarned={result.energyEarned}
        xpEarned={result.xpEarned}
        newLevel={sessionNumber}
        onNextLevel={handleAnotherExercise}
        onExit={handleExit}
        nextLevelLabel="Сделать ещё одно упражнение"
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
          Выбрать упражнение
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
