'use client'
// Top-level outdoor scene. Perspective camera + 3rd-person follow rig.

import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Hud } from '@/components/play/Hud'
import { Field } from './Field'
import { Houses } from './Houses'
import { Character } from './Character'
import { CameraRig } from './CameraRig'
import { Joystick } from './Joystick'
import { RotationJoystick } from './RotationJoystick'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import type { ChildSummary } from '@/server/actions/progress'

interface WorldProps {
  initialSummary: ChildSummary
}

export function World({ initialSummary }: WorldProps) {
  const setSummary = useGameStore((s) => s.setSummary)
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)
  const isMountedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    if (isMountedRef.current) return
    isMountedRef.current = true
    setSummary({
      coins: initialSummary.coins,
      energy: initialSummary.energy,
      homeLevel: initialSummary.homeLevel,
    })
    setBounds(14, 9)
    setPosition(0, 0, 4)
    setCameraDistance(11)
    setCameraPitch(0.7)
    setCameraYaw(0)
  }, [
    initialSummary,
    setSummary,
    setBounds,
    setPosition,
    setCameraDistance,
    setCameraPitch,
    setCameraYaw,
  ])

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  useSceneInput(containerRef)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100dvw',
        height: '100dvh',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <Canvas
        camera={{
          position: [0, 8, 12],
          fov: 45,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ background: '#87CEEB' }}
      >
        <CameraRig />
        <Field />
        <Houses />
        <Character />
      </Canvas>

      <Hud />

      {isTouchDevice && (
        <>
          <Joystick />
          <RotationJoystick />
        </>
      )}
    </div>
  )
}
