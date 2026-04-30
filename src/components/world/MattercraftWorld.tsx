'use client'
// Top-level Mattercraft scene container — replaces the procedural World.tsx.
// Wires Canvas + scene + character + portals + HUD + left joystick + jump/run.

import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Hud } from '@/components/play/Hud'
import { ActionButtons } from '@/components/play/ActionButtons'
import { CameraRig } from './CameraRig'
import { CharacterGLB, type CharacterGender } from './CharacterGLB'
import { Joystick } from './Joystick'
import { MattercraftScene } from './MattercraftScene'
import { BorderForest } from './BorderForest'
import { Portals } from './Portals'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import type { ChildSummary } from '@/server/actions/progress'

interface MattercraftWorldProps {
  initialSummary: ChildSummary
}

export function MattercraftWorld({ initialSummary }: MattercraftWorldProps) {
  const setSummary = useGameStore((s) => s.setSummary)
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)
  const isMountedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const gender: CharacterGender = initialSummary.gender ?? 'BOY'

  useEffect(() => {
    if (isMountedRef.current) return
    isMountedRef.current = true
    setSummary({
      coins: initialSummary.coins,
      energy: initialSummary.energy,
      homeLevel: initialSummary.homeLevel,
    })
    // Mattercraft scene is ~50×50 units centered at origin. Houses sit on a
    // ring at radius ~20. Bounds are slightly inside the ground image edge.
    setBounds(24, 24)
    setPosition(0, 0, 0)
    setCameraDistance(12)
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
          far: 400,
        }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ background: '#A8DCFF' }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[15, 25, 10]} intensity={1.0} />
        <hemisphereLight args={['#dfefff', '#5b8a6a', 0.4]} />
        <CameraRig />
        <MattercraftScene />
        <BorderForest tileSize={50} />
        <Portals />
        <CharacterGLB gender={gender} />
      </Canvas>

      <Hud />
      <ActionButtons />

      {isTouchDevice && <Joystick />}
    </div>
  )
}
