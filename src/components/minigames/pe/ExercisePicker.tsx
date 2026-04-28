'use client'

import { useRouter } from 'next/navigation'
import { PE_EXERCISES } from '@/server/content/pe'
import type { PEExercise } from '@/server/content/pe'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExercisePickerProps {
  onPick: (exerciseKey: string) => void
}

// ---------------------------------------------------------------------------
// ExerciseCard
// ---------------------------------------------------------------------------

function ExerciseCard({
  exercise,
  onPick,
}: {
  exercise: PEExercise
  onPick: (key: string) => void
}) {
  return (
    <div
      className="rounded-[1rem] border border-[--color-border] bg-[--color-muted] flex flex-col overflow-hidden"
      style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.08)' }}
    >
      {/* 16:9 illustration area */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exercise.illustration}
          alt={exercise.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Fallback: hide broken image, placeholder bg shows through
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
        {/* Coloured placeholder visible when image missing */}
        <div
          className="absolute inset-0 flex items-center justify-center text-4xl"
          style={{ backgroundColor: '#4DA8DA22' }}
          aria-hidden="true"
        >
          <span style={{ opacity: 0.4, fontSize: '3rem' }}>🏃</span>
        </div>
      </div>

      {/* Text content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3
          className="text-[18px] font-extrabold text-[--color-foreground] leading-snug"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {exercise.name}
        </h3>
        <p className="text-[14px] text-[--color-foreground] opacity-60 leading-snug flex-1">
          {exercise.instruction}
        </p>
        <Button
          onClick={() => onPick(exercise.key)}
          className="w-full min-h-[56px] text-base font-semibold rounded-[0.75rem] bg-[--color-primary] text-white hover:bg-[--color-primary]/90 cursor-pointer mt-2"
        >
          Начать
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExercisePicker
// ---------------------------------------------------------------------------

export function ExercisePicker({ onPick }: ExercisePickerProps) {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-[--color-background] p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6 max-w-2xl mx-auto">
        <h1
          className="text-[22px] font-extrabold text-[--color-foreground]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Физкультура
        </h1>
        <Button
          variant="ghost"
          onClick={() => router.push('/play')}
          className="text-base font-semibold text-[--color-foreground] hover:bg-[--color-border] rounded-[0.75rem] cursor-pointer"
        >
          Выйти
        </Button>
      </div>

      {/* Exercise grid: 1 col on mobile, 2 col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {PE_EXERCISES.map((exercise) => (
          <ExerciseCard key={exercise.key} exercise={exercise} onPick={onPick} />
        ))}
      </div>
    </div>
  )
}
