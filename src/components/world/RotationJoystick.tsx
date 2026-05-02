'use client'
// Right-side virtual joystick for rotating the camera.
// X-axis → addCameraYaw at a smooth rate per second.
// Y-axis → setCameraPitch within the store-clamped range.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const SIZE = 100
const KNOB = 44
const MAX_DIST = (SIZE - KNOB) / 2

// How fast pulling the stick fully right rotates the camera (rad / s).
const YAW_RATE = 2.6
// How much pulling the stick fully up/down moves the pitch (radians).
const PITCH_RANGE = 0.45

export function RotationJoystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const activePointer = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })
  const inputRef = useRef({ x: 0, y: 0 }) // -1..1
  const basePitch = useRef(0.75)

  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 })

  // Continuous yaw integration via rAF — keeps rate independent of polling.
  useEffect(() => {
    let rafId: number | null = null
    let last = performance.now()

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { x } = inputRef.current
      if (x !== 0) {
        useGameStore.getState().addCameraYaw(x * YAW_RATE * dt)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
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
    basePitch.current = useGameStore.getState().cameraPitch
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

    const nx = cx / MAX_DIST // -1..1
    const ny = cy / MAX_DIST
    inputRef.current = { x: nx, y: ny }
    // Pitch: pulling stick up (negative y) raises the camera (more top-down).
    useGameStore.getState().setCameraPitch(basePitch.current - ny * PITCH_RANGE)
  }, [])

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (activePointer.current !== e.pointerId) return
    activePointer.current = null
    setKnobOffset({ x: 0, y: 0 })
    inputRef.current = { x: 0, y: 0 }
  }, [])

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
      ref={baseRef}
      style={{
        position: 'absolute',
        bottom: '5rem',
        right: '2rem',
        width: SIZE,
        height: SIZE,
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
    >
      <div
        style={{
          width: KNOB,
          height: KNOB,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          border: '2px solid rgba(255,255,255,0.65)',
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />
      {/* Decorative circular arrows */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        style={{
          position: 'absolute',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <path
          d="M4 10 a6 6 0 1 1 12 0"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <polygon points="14,4 18,4 16,8" fill="#fff" />
      </svg>
    </div>
  )
}
