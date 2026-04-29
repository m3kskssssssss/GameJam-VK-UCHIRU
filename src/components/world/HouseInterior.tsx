'use client'
// 3D interior scene for /play/home.
// White grid floor, simple walls, a door at the front, placed furniture as
// 3D primitives, and the same 2D billboard character used outdoors.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Character } from './Character'
import { CameraRig } from './CameraRig'
import { Joystick } from './Joystick'
import { Furniture3D } from './Furniture3D'
import { useGameStore } from '@/hooks/useGameStore'
import type { RoomPlacementSummary } from '@/server/actions/rooms'

// Room dimensions (cells × meters per cell). 8 wide × 6 deep matches the
// existing placement schema (x: 0..7, y: 0..5).
const COLS = 8
const ROWS = 6
const CELL = 1
const FLOOR_W = COLS * CELL
const FLOOR_D = ROWS * CELL
const WALL_H = 2.6
const WALL_T = 0.18

interface Props {
  placements: RoomPlacementSummary[]
  /** Called when the character walks into the door zone and confirms exit. */
  onExit: () => void
}

// ── Indoor scene ────────────────────────────────────────────────────────────

function IndoorScene({ placements }: { placements: RoomPlacementSummary[] }) {
  const floorTex = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#bdbdbd'
    ctx.lineWidth = 2
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
    tex.repeat.set(1, FLOOR_D / FLOOR_W)
    return tex
  }, [])

  const halfW = FLOOR_W / 2
  const halfD = FLOOR_D / 2

  return (
    <group>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 10, 5]} intensity={0.55} />
      <hemisphereLight color="#ffffff" groundColor="#f4f0e6" intensity={0.4} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshLambertMaterial map={floorTex} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, WALL_H / 2, -halfD - WALL_T / 2]}>
        <boxGeometry args={[FLOOR_W + WALL_T * 2, WALL_H, WALL_T]} />
        <meshLambertMaterial color="#FAEDCD" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-halfW - WALL_T / 2, WALL_H / 2, 0]}>
        <boxGeometry args={[WALL_T, WALL_H, FLOOR_D]} />
        <meshLambertMaterial color="#F5E1B4" />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfW + WALL_T / 2, WALL_H / 2, 0]}>
        <boxGeometry args={[WALL_T, WALL_H, FLOOR_D]} />
        <meshLambertMaterial color="#F5E1B4" />
      </mesh>

      {/* Front wall — split for door gap */}
      <mesh position={[-(halfW / 2 + 0.6), WALL_H / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[halfW - 1.2, WALL_H, WALL_T]} />
        <meshLambertMaterial color="#FAEDCD" />
      </mesh>
      <mesh position={[halfW / 2 + 0.6, WALL_H / 2, halfD + WALL_T / 2]}>
        <boxGeometry args={[halfW - 1.2, WALL_H, WALL_T]} />
        <meshLambertMaterial color="#FAEDCD" />
      </mesh>
      {/* Lintel above the door */}
      <mesh position={[0, WALL_H - 0.25, halfD + WALL_T / 2]}>
        <boxGeometry args={[2.4, 0.5, WALL_T]} />
        <meshLambertMaterial color="#FAEDCD" />
      </mesh>

      {/* Door visual (a coloured panel within the gap, slightly recessed) */}
      <mesh position={[0, 1.0, halfD + 0.01]}>
        <planeGeometry args={[1.6, 2.0]} />
        <meshBasicMaterial color="#5D4037" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.45, 1.0, halfD + 0.02]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#FFC107" />
      </mesh>

      {/* Welcome rug at the door */}
      <mesh
        position={[0, 0.01, halfD - 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.4, 0.6]} />
        <meshBasicMaterial color="#FFB347" />
      </mesh>

      {/* Placed furniture */}
      {placements.map((p) => {
        // Map grid (col 0..7, row 0..5) → world (-halfW + 0.5 .. halfW - 0.5)
        const wx = p.x - (COLS - 1) / 2
        const wz = p.y - (ROWS - 1) / 2
        return (
          <Furniture3D
            key={p.id}
            catalogKey={p.catalogKey}
            position={[wx, 0, wz]}
          />
        )
      })}
    </group>
  )
}

// ── Door trigger — sets local nearExit flag based on character position ────

function DoorTrigger({ onSetNear }: { onSetNear: (b: boolean) => void }) {
  const wasNear = useRef(false)
  const halfD = FLOOR_D / 2
  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    // Door is centred at x=0, z = halfD. Trigger when within ~1.2m.
    const near = pz > halfD - 1.2 && Math.abs(px) < 1.0
    if (near !== wasNear.current) {
      wasNear.current = near
      onSetNear(near)
    }
  })
  return null
}

// ── Wrapper component ──────────────────────────────────────────────────────

export function HouseInterior({ placements, onExit }: Props) {
  const setVelocity = useGameStore((s) => s.setVelocity)
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const [nearExit, setNearExit] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Reset bounds + spawn position on mount.
  useEffect(() => {
    const halfW = FLOOR_W / 2 - 0.5
    const halfD = FLOOR_D / 2 - 0.5
    setBounds(halfW, halfD)
    setPosition(0, 0, halfD - 1.0) // just inside the door, facing inward
  }, [setBounds, setPosition])

  // Detect touch only on the client.
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  // Keyboard input
  useEffect(() => {
    const held = new Set<string>()
    function compute() {
      let vx = 0
      let vz = 0
      if (held.has('ArrowLeft') || held.has('a') || held.has('A')) vx -= 1
      if (held.has('ArrowRight') || held.has('d') || held.has('D')) vx += 1
      if (held.has('ArrowUp') || held.has('w') || held.has('W')) vz -= 1
      if (held.has('ArrowDown') || held.has('s') || held.has('S')) vz += 1
      setVelocity(vx, vz)
    }
    function down(e: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
      held.add(e.key)
      compute()
    }
    function up(e: KeyboardEvent) {
      held.delete(e.key)
      compute()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      held.clear()
      setVelocity(0, 0)
    }
  }, [setVelocity])

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        width: '100%',
        background: '#FAEDCD',
        overflow: 'hidden',
      }}
    >
      <Canvas
        orthographic
        camera={{
          position: [0, 10, 7],
          near: 0.1,
          far: 100,
          zoom: 60,
        }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ background: '#FAEDCD' }}
      >
        <CameraRig
          zoomMobile={70}
          zoomDesktop={95}
          offset={[0, 9, 6]}
          lookAtY={0.4}
        />
        <IndoorScene placements={placements} />
        <DoorTrigger onSetNear={setNearExit} />
        <Character />
      </Canvas>

      {nearExit && (
        <div
          style={{
            position: 'absolute',
            bottom: '5.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={onExit}
            style={{
              padding: '0.95rem 2.2rem',
              background: '#4DA8DA',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(77,168,218,0.45)',
              letterSpacing: '0.01em',
            }}
          >
            Выйти из дома
          </button>
        </div>
      )}

      {isTouchDevice && <Joystick />}
    </div>
  )
}
