'use client'
// Top-level Mattercraft scene container — replaces the procedural World.tsx.
// Wires Canvas + scene + character + portals + HUD + left joystick + jump/run.

import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Hud } from '@/components/play/Hud'
import { ActionButtons } from '@/components/play/ActionButtons'
import { AmbientAudio } from '@/components/play/AmbientAudio'
import { CameraRig } from './CameraRig'
import { CharacterGLB, type CharacterGender } from './CharacterGLB'
import { Joystick } from './Joystick'
import { MattercraftScene } from './MattercraftScene'
import { BorderForest } from './BorderForest'
import { SceneLights } from './SceneLights'
import { Portals } from './Portals'
import { Npcs } from './Npcs'
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
  const setNearHouse = useGameStore((s) => s.setNearHouse)
  const setNearNpc = useGameStore((s) => s.setNearNpc)
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
    // Clear leftover nearHouse from a previous /play visit. The Portals'
    // proximity check only fires `setNearHouse` on near→far transitions; if
    // the user left the world *while* near a portal, that flag is still set
    // when they come back, and the "Войти в домик" CTA shows even though
    // the player has just respawned at origin.
    setNearHouse(null)
    setNearNpc(null)
    // Mattercraft scene is ~50×50 units centered at origin. Houses sit on a
    // ring at radius ~20. Bounds are slightly inside the ground image edge.
    setBounds(24, 24)
    setPosition(0, 0, 0)
    // Closer Zelda-ish camera: distance 8, pitch ~32° — camera sits ~5m up
    // and ~7m behind the player, instead of the old 12/40° (8.6m / 9.2m)
    // that felt like a top-down view.
    setCameraDistance(8)
    setCameraPitch(0.55)
    setCameraYaw(0)
  }, [
    initialSummary,
    setSummary,
    setBounds,
    setPosition,
    setCameraDistance,
    setCameraPitch,
    setCameraYaw,
    setNearHouse,
    setNearNpc,
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
        shadows="soft"
        style={{ background: '#A8DCFF' }}
      >
        <SceneLights size={50} />
        <CameraRig />
        <MattercraftScene />
        <BorderForest tileSize={50} />
        <Portals />
        <Npcs />
        <CharacterGLB gender={gender} />
      </Canvas>

      <Hud />
      <ActionButtons />
      <AmbientAudio src="/village.mp3" />

      {isTouchDevice && <Joystick />}
    </div>
  )
}
