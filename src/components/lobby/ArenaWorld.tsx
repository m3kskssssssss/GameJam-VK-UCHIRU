'use client'
// 3D arena scene for the lobby coin-collection mini-game.
// - Local player: same animated billboard character used in /play.
// - Remote players: simple coloured billboards that lerp toward server pos.
// - Coins: spinning gold cylinders at integer cell centres.

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Character } from '@/components/world/Character'
import { CameraRig } from '@/components/world/CameraRig'
import { useGameStore } from '@/hooks/useGameStore'
import type { MatchState } from '@/server/actions/lobby-helpers'

// Field config — must match the server-side constants.
const GRID_W = 24
const GRID_H = 16
const HALF_W = GRID_W / 2
const HALF_D = GRID_H / 2
const FENCE_H = 0.7
const FENCE_T = 0.2

function cellToWorld(col: number, row: number) {
  return { x: col - GRID_W / 2 + 0.5, z: row - GRID_H / 2 + 0.5 }
}

// Deterministic colour per remote player, matching the original list.
const REMOTE_COLOURS = [
  '#E53935',
  '#FB8C00',
  '#8E24AA',
  '#EC407A',
  '#00ACC1',
  '#7CB342',
  '#FFB300',
  '#5E35B1',
]
function colourFor(childId: string, index: number, isMe: boolean): string {
  if (isMe) return '#4DA8DA'
  return REMOTE_COLOURS[index % REMOTE_COLOURS.length]
}

// ── Ground + fence ─────────────────────────────────────────────────────────

function ArenaGround() {
  const tex = useMemo(() => {
    const size = 512
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#7CB342'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'
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
    const t = new THREE.CanvasTexture(c)
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
    t.repeat.set(GRID_W / 4, GRID_H / 4)
    return t
  }, [])

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 16, 8]} intensity={0.7} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[GRID_W, GRID_H]} />
        <meshLambertMaterial map={tex} />
      </mesh>

      {/* Fence */}
      <mesh position={[0, FENCE_H / 2, -HALF_D - FENCE_T / 2]}>
        <boxGeometry args={[GRID_W + FENCE_T * 2, FENCE_H, FENCE_T]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[0, FENCE_H / 2, HALF_D + FENCE_T / 2]}>
        <boxGeometry args={[GRID_W + FENCE_T * 2, FENCE_H, FENCE_T]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[-HALF_W - FENCE_T / 2, FENCE_H / 2, 0]}>
        <boxGeometry args={[FENCE_T, FENCE_H, GRID_H]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[HALF_W + FENCE_T / 2, FENCE_H / 2, 0]}>
        <boxGeometry args={[FENCE_T, FENCE_H, GRID_H]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
    </group>
  )
}

// ── Coin (spinning gold cylinder) ──────────────────────────────────────────

function Coin({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  // Per-coin spin speed offset for variety
  const offset = useRef(Math.random() * Math.PI * 2)
  useFrame((s, dt) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += dt * 2.4
    g.position.y = position[1] + 0.5 + Math.sin(s.clock.elapsedTime * 2.2 + offset.current) * 0.12
  })
  return (
    <group ref={ref} position={position}>
      {/* Outer rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 18]} />
        <meshLambertMaterial color="#FFD54F" emissive="#FFB300" emissiveIntensity={0.25} />
      </mesh>
      {/* Inner */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.085, 18]} />
        <meshLambertMaterial color="#FFC107" />
      </mesh>
      {/* Faint glow plane */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#FFD54F" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

// ── Remote player billboard ────────────────────────────────────────────────

function RemotePlayer({
  position,
  colour,
  label,
}: {
  position: { x: number; z: number }
  colour: string
  label: string
}) {
  const ref = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(position.x, 0, position.z))
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  // Update target every frame from prop (props change on poll updates).
  useEffect(() => {
    targetPos.current.set(position.x, 0, position.z)
  }, [position.x, position.z])

  const texture = useMemo(() => {
    const W = 64
    const H = 96
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')!
    // Hair
    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.ellipse(32, 14, 12, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    // Head
    ctx.fillStyle = '#FFE0B2'
    ctx.beginPath()
    ctx.arc(32, 20, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#A67C52'
    ctx.lineWidth = 1.2
    ctx.stroke()
    // Eyes
    ctx.fillStyle = '#1F2937'
    ctx.beginPath()
    ctx.arc(28, 21, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(36, 21, 1.6, 0, Math.PI * 2)
    ctx.fill()
    // Body — colour varies per player
    ctx.fillStyle = colour
    ctx.fillRect(22, 30, 20, 24)
    ctx.strokeStyle = '#1F2937'
    ctx.strokeRect(22, 30, 20, 24)
    // Arms
    ctx.fillStyle = '#FFE0B2'
    ctx.fillRect(16, 32, 6, 18)
    ctx.fillRect(42, 32, 6, 18)
    // Pants
    ctx.fillStyle = '#1F2937'
    ctx.fillRect(22, 54, 20, 12)
    // Legs
    ctx.fillStyle = '#3F2A1A'
    ctx.fillRect(24, 66, 6, 16)
    ctx.fillRect(34, 66, 6, 16)
    // Shoes
    ctx.fillStyle = '#1F2937'
    ctx.fillRect(23, 78, 8, 4)
    ctx.fillRect(33, 78, 8, 4)
    const tex = new THREE.CanvasTexture(c)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [colour])

  useFrame((s, dt) => {
    const g = ref.current
    if (!g) return
    // Smooth follow
    g.position.x = THREE.MathUtils.lerp(g.position.x, targetPos.current.x, Math.min(1, dt * 8))
    g.position.z = THREE.MathUtils.lerp(g.position.z, targetPos.current.z, Math.min(1, dt * 8))
    g.position.y = 0.75 + Math.sin(s.clock.elapsedTime * 5 + position.x) * 0.04
    // Billboard
    g.quaternion.copy(s.camera.quaternion)
  })

  return (
    <group ref={ref} position={[position.x, 0.75, position.z]}>
      <mesh>
        <planeGeometry args={[1.0, 1.5]} />
        <meshBasicMaterial
          ref={matRef}
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Text
        position={[0, 1.0, 0]}
        fontSize={0.22}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000"
      >
        {label}
      </Text>
    </group>
  )
}

// ── Position broadcaster — calls onPosition(x, z) at most every interval ─

function PositionBroadcaster({
  intervalMs,
  onPosition,
}: {
  intervalMs: number
  onPosition: (x: number, z: number) => void
}) {
  const lastSentRef = useRef({ t: 0, x: NaN, z: NaN })
  useFrame(() => {
    const now = performance.now()
    if (now - lastSentRef.current.t < intervalMs) return
    const [px, , pz] = useGameStore.getState().position
    if (
      Number.isFinite(lastSentRef.current.x) &&
      Math.abs(px - lastSentRef.current.x) < 0.05 &&
      Math.abs(pz - lastSentRef.current.z) < 0.05
    ) {
      return
    }
    lastSentRef.current = { t: now, x: px, z: pz }
    onPosition(px, pz)
  })
  return null
}

// ── Component ──────────────────────────────────────────────────────────────

export interface ArenaWorldProps {
  state: MatchState
  hiddenCoinIds: Set<string>
  onPosition: (x: number, z: number) => void
  positionIntervalMs?: number
}

export function ArenaWorld({
  state,
  hiddenCoinIds,
  onPosition,
  positionIntervalMs = 110,
}: ArenaWorldProps) {
  // Visible coins = unclaimed and not in hiddenCoinIds (locally hidden after collect).
  const visibleCoins = state.tiles.filter(
    (t) => t.stompedById === null && !hiddenCoinIds.has(t.id),
  )
  const remotePlayers = state.players.filter((p) => p.childId !== state.me.childId)
  const sortedAll = [...state.players].sort((a, b) =>
    a.childId.localeCompare(b.childId),
  )

  return (
    <Canvas
      camera={{ position: [0, 8, 12], fov: 50, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      shadows={false}
      style={{ background: '#87CEEB', width: '100%', height: '100%' }}
    >
      <CameraRig headHeight={0.9} />
      <ArenaGround />

      {/* Coins */}
      {visibleCoins.map((c) => {
        const w = cellToWorld(c.x, c.y)
        return <Coin key={c.id} position={[w.x, 0.5, w.z]} />
      })}

      {/* Remote players */}
      {remotePlayers.map((p) => {
        const idx = sortedAll.findIndex((x) => x.childId === p.childId)
        const isMe = false
        return (
          <RemotePlayer
            key={p.childId}
            position={{ x: p.x, z: p.y }}
            colour={colourFor(p.childId, idx, isMe)}
            label={p.displayName}
          />
        )
      })}

      {/* Local player + camera-driven movement */}
      <Character />

      <PositionBroadcaster intervalMs={positionIntervalMs} onPosition={onPosition} />
    </Canvas>
  )
}
