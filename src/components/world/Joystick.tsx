'use client'
// Virtual joystick DOM overlay for mobile input.
// Uses pointer events; no heavyweight library required.

import { useRef, useCallback, useEffect, useState } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const JOYSTICK_SIZE = 100  // outer ring diameter px
const KNOB_SIZE = 44        // inner knob diameter px
const MAX_DIST = (JOYSTICK_SIZE - KNOB_SIZE) / 2

interface Point { x: number; y: number }

export function Joystick() {
  const setVelocity = useGameStore((s) => s.setVelocity)

  const baseRef = useRef<HTMLDivElement>(null)
  const activePointer = useRef<number | null>(null)
  const origin = useRef<Point>({ x: 0, y: 0 })

  const [knobOffset, setKnobOffset] = useState<Point>({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport and update on resize
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (activePointer.current !== null) return
    activePointer.current = e.pointerId
    const rect = baseRef.current?.getBoundingClientRect()
    if (!rect) return
    origin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (activePointer.current !== e.pointerId) return

    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    const clampedDist = Math.min(dist, MAX_DIST)
    const angle = Math.atan2(dy, dx)
    const cx = clampedDist * Math.cos(angle)
    const cy = clampedDist * Math.sin(angle)

    setKnobOffset({ x: cx, y: cy })

    // Normalise to unit vector for velocity (dy → z axis)
    const factor = dist > 0 ? 1 / dist : 0
    const nx = dx * factor
    const nz = dy * factor  // screen-Y maps to world-Z
    setVelocity(nx, nz)
  }, [setVelocity])

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (activePointer.current !== e.pointerId) return
    activePointer.current = null
    setKnobOffset({ x: 0, y: 0 })
    setVelocity(0, 0)
  }, [setVelocity])

  useEffect(() => {
    const el = baseRef.current
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onPointerDown, onPointerMove, onPointerUp])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '5rem',
        left: isMobile ? 'calc(15% + 36px)' : '2rem',
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)',
        border: '2px solid rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 10,
      }}
      ref={baseRef}
    >
      {/* Knob */}
      <div
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          border: '2px solid rgba(255,255,255,0.65)',
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}
