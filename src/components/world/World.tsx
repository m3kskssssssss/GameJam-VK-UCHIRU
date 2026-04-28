'use client'
// Top-level game world client component.
// Wraps the R3F Canvas, HUD overlay, and Joystick.
// Keyboard input is handled here via useEffect on window.

import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Hud } from '@/components/play/Hud'
import { Field } from './Field'
import { Houses } from './Houses'
import { Character } from './Character'
import { CameraRig } from './CameraRig'
import { Joystick } from './Joystick'
import { useGameStore } from '@/hooks/useGameStore'
import type { ChildSummary } from '@/server/actions/progress'

interface WorldProps {
  initialSummary: ChildSummary
}

// Track which keys are currently held
const heldKeys = new Set<string>()

function computeVelocity() {
  let vx = 0
  let vz = 0
  if (heldKeys.has('ArrowLeft') || heldKeys.has('a') || heldKeys.has('A')) vx -= 1
  if (heldKeys.has('ArrowRight') || heldKeys.has('d') || heldKeys.has('D')) vx += 1
  if (heldKeys.has('ArrowUp') || heldKeys.has('w') || heldKeys.has('W')) vz -= 1
  if (heldKeys.has('ArrowDown') || heldKeys.has('s') || heldKeys.has('S')) vz += 1
  return { vx, vz }
}

export function World({ initialSummary }: WorldProps) {
  const setSummary = useGameStore((s) => s.setSummary)
  const setVelocity = useGameStore((s) => s.setVelocity)
  const isMountedRef = useRef(false)

  // Seed store with server data on mount
  useEffect(() => {
    if (isMountedRef.current) return
    isMountedRef.current = true
    setSummary({
      coins: initialSummary.coins,
      energy: initialSummary.energy,
      homeLevel: initialSummary.homeLevel,
    })
  }, [initialSummary, setSummary])

  // Keyboard input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Prevent default scroll on arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
      heldKeys.add(e.key)
      const { vx, vz } = computeVelocity()
      setVelocity(vx, vz)
    }

    function onKeyUp(e: KeyboardEvent) {
      heldKeys.delete(e.key)
      const { vx, vz } = computeVelocity()
      setVelocity(vx, vz)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      heldKeys.clear()
    }
  }, [setVelocity])

  // Detect touch capability for joystick visibility
  const isTouchDevice =
    typeof window !== 'undefined' && 'ontouchstart' in window

  return (
    <div style={{ position: 'relative', width: '100dvw', height: '100dvh', overflow: 'hidden' }}>
      {/* R3F Canvas */}
      <Canvas
        orthographic
        camera={{
          position: [0, 14, 10],
          near: 0.1,
          far: 200,
          zoom: 38,
        }}
        dpr={[1, 2]}
        shadows={false}
        style={{ background: '#87CEEB' }}  // sky blue background
      >
        <CameraRig />
        <Field />
        <Houses />
        <Character />
      </Canvas>

      {/* HUD sits outside Canvas as DOM overlay */}
      <Hud />

      {/* Virtual joystick for touch devices */}
      {isTouchDevice && <Joystick />}
    </div>
  )
}
