'use client'
// 3D lobby scene — small grass field with a single demo "game house".
// Walking near the house pops up an "Войти в игровой домик" CTA that pushes
// to /play/lobby/arena.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { Character } from './Character'
import { CameraRig } from './CameraRig'
import { Joystick } from './Joystick'
import { RotationJoystick } from './RotationJoystick'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import { ru } from '@/i18n/ru'

const t = ru.lobby

const FIELD_W = 22
const FIELD_D = 16
const FENCE_H = 0.8
const FENCE_T = 0.2
const HOUSE_POS: [number, number, number] = [0, 0, -3]
const TRIGGER_RADIUS = 2.4
const TRIGGER_RADIUS_SQ = TRIGGER_RADIUS * TRIGGER_RADIUS

function LobbyGround() {
  const groundTex = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#8BC34A'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    const cells = 8
    const step = size / cells
    for (let i = 0; i <= cells; i++) {
      ctx.beginPath()
      ctx.moveTo(i * step, 0)
      ctx.lineTo(i * step, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * step)
      ctx.lineTo(size, i * step)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 3)
    return tex
  }, [])

  const hw = FIELD_W / 2
  const hd = FIELD_D / 2

  return (
    <group>
      <ambientLight intensity={0.75} />
      <directionalLight position={[10, 18, 10]} intensity={0.7} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[FIELD_W, FIELD_D]} />
        <meshLambertMaterial map={groundTex} />
      </mesh>

      {/* Fence */}
      <mesh position={[0, FENCE_H / 2, -hd - FENCE_T / 2]}>
        <boxGeometry args={[FIELD_W + FENCE_T * 2, FENCE_H, FENCE_T]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[0, FENCE_H / 2, hd + FENCE_T / 2]}>
        <boxGeometry args={[FIELD_W + FENCE_T * 2, FENCE_H, FENCE_T]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[-hw - FENCE_T / 2, FENCE_H / 2, 0]}>
        <boxGeometry args={[FENCE_T, FENCE_H, FIELD_D]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[hw + FENCE_T / 2, FENCE_H / 2, 0]}>
        <boxGeometry args={[FENCE_T, FENCE_H, FIELD_D]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>

      {/* Decorative bushes */}
      <mesh position={[-7, 0.4, -6]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshLambertMaterial color="#43A047" />
      </mesh>
      <mesh position={[7, 0.4, -6]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshLambertMaterial color="#43A047" />
      </mesh>
      <mesh position={[-7, 0.4, 5]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshLambertMaterial color="#388E3C" />
      </mesh>
      <mesh position={[7, 0.4, 5]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshLambertMaterial color="#388E3C" />
      </mesh>
    </group>
  )
}

function GameHouse({ onSetNear }: { onSetNear: (b: boolean) => void }) {
  const wasNear = useRef(false)
  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const dx = px - HOUSE_POS[0]
    const dz = pz - HOUSE_POS[2] - 1.6
    const distSq = dx * dx + dz * dz
    const near = distSq < TRIGGER_RADIUS_SQ
    if (near !== wasNear.current) {
      wasNear.current = near
      onSetNear(near)
    }
  })

  return (
    <group position={HOUSE_POS}>
      {/* Foundation */}
      <mesh position={[0, 0.05, 1.4]}>
        <boxGeometry args={[2.6, 0.1, 0.5]} />
        <meshLambertMaterial color="#9E9E9E" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.6, 2.0, 2.6]} />
        <meshLambertMaterial color="#FFB347" />
      </mesh>
      {/* Roof — gable */}
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[1.85, 1.85, 2.8, 4, 1]} />
        <meshLambertMaterial color="#E53935" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.65, 1.31]}>
        <planeGeometry args={[0.7, 1.2]} />
        <meshLambertMaterial color="#5D4037" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.2, 0.7, 1.32]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#FFC107" />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.85, 1.4, 1.31]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial color="#90CAF9" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.85, 1.4, 1.31]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial color="#90CAF9" side={THREE.DoubleSide} />
      </mesh>
      {/* Sign */}
      <Text
        position={[0, 4.1, 0]}
        fontSize={0.55}
        color="#1F2937"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#ffffff"
        maxWidth={4.5}
      >
        {t.enterArena}
      </Text>
    </group>
  )
}

export function LobbyWorld() {
  const router = useRouter()
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)
  const [nearHouse, setNearHouse] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBounds(FIELD_W / 2 - 0.5, FIELD_D / 2 - 0.5)
    setPosition(0, 0, 4)
    setCameraDistance(10)
    setCameraPitch(0.7)
    setCameraYaw(0)
  }, [setBounds, setPosition, setCameraDistance, setCameraPitch, setCameraYaw])

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
        background: '#87CEEB',
        touchAction: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 8, 12], fov: 45, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ background: '#87CEEB' }}
      >
        <CameraRig />
        <LobbyGround />
        <GameHouse onSetNear={setNearHouse} />
        <Character />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.85)',
          padding: '0.5rem 1.2rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2937' }}>
          {t.title}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
          {t.subtitle}
        </div>
      </div>

      <button
        onClick={() => router.push('/play')}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(255,255,255,0.9)',
          border: '1.5px solid rgba(0,0,0,0.08)',
          borderRadius: '0.7rem',
          padding: '0.45rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#1F2937',
          fontFamily: 'Nunito, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 20,
        }}
      >
        ← {t.back}
      </button>

      {nearHouse && (
        <div
          style={{
            position: 'absolute',
            bottom: '5.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
          }}
        >
          <button
            onClick={() => router.push('/play/lobby/arena')}
            style={{
              padding: '1rem 2.5rem',
              background: '#4DA8DA',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(77,168,218,0.5)',
              letterSpacing: '0.01em',
            }}
          >
            {t.enterArena}
          </button>
        </div>
      )}

      {isTouchDevice && (
        <>
          <Joystick />
          <RotationJoystick />
        </>
      )}
    </div>
  )
}
