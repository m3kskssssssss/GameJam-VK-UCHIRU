'use client'
// On-screen Jump / Run buttons. Replaces the right-side rotation joystick
// in the Mattercraft world. Run is hold-to-activate, Jump is tap-to-fire.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const SIZE = 68

// Plain semi-transparent white look for both buttons. Active state stays
// white but slightly brighter + scale-down — never coloured.
const BG_IDLE = 'rgba(255,255,255,0.38)'
const BG_ACTIVE = 'rgba(255,255,255,0.62)'
const BORDER = '2px solid rgba(255,255,255,0.65)'

interface ButtonProps {
  label: string
  hint: string
  bottom: number
  right: number
  active?: boolean
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerUp?: (e: React.PointerEvent) => void
  onPointerCancel?: (e: React.PointerEvent) => void
}

function ActionButton({
  label,
  hint,
  bottom,
  right,
  active = false,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={hint}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        bottom,
        right,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background: active ? BG_ACTIVE : BG_IDLE,
        border: BORDER,
        boxShadow: active
          ? '0 2px 6px rgba(0,0,0,0.18)'
          : '0 4px 10px rgba(0,0,0,0.18)',
        color: '#1F2937',
        fontSize: 28,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'pointer',
        zIndex: 10,
        transition: 'transform 0.1s ease, background 0.12s ease',
        transform: active ? 'scale(0.94)' : 'scale(1)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    >
      {label}
    </button>
  )
}

export function ActionButtons() {
  const isRunning = useGameStore((s) => s.isRunning)
  const setRunning = useGameStore((s) => s.setRunning)
  const jump = useGameStore((s) => s.jump)
  const [jumpFlash, setJumpFlash] = useState(false)
  const flashTimerRef = useRef<number | null>(null)

  const handleJumpDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      jump()
      setJumpFlash(true)
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
      flashTimerRef.current = window.setTimeout(() => setJumpFlash(false), 180)
    },
    [jump],
  )

  const handleRunDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setRunning(true)
    },
    [setRunning],
  )
  const handleRunUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setRunning(false)
    },
    [setRunning],
  )

  useEffect(
    () => () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
    },
    [],
  )

  return (
    <>
      <ActionButton
        label="↑"
        hint="Прыжок"
        bottom={148}
        right={32}
        active={jumpFlash}
        onPointerDown={handleJumpDown}
      />
      <ActionButton
        label="⚡"
        hint="Бег"
        bottom={64}
        right={32}
        active={isRunning}
        onPointerDown={handleRunDown}
        onPointerUp={handleRunUp}
        onPointerCancel={handleRunUp}
      />
    </>
  )
}
