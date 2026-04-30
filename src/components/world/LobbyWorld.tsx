'use client'
// 3D lobby scene — uses the GLB-based scene exported from for-lobby/Scene.zcomp
// (lobbymap.png ground + bushes/trees/grass/doors). Player walks around with
// the same 3D character used in /play. One of the 4 doors is wrapped in a
// glowing portal that pushes the player into the multi-player arena.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { CameraRig } from './CameraRig'
import { CharacterGLB, type CharacterGender } from './CharacterGLB'
import { Joystick } from './Joystick'
import { RotationJoystick } from './RotationJoystick'
import { LobbyScene } from './LobbyScene'
import { LOBBY_SCENE_INSTANCES } from './lobby-scene-data'
import { RemoteLobbyPlayer } from './RemoteLobbyPlayer'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import { ru } from '@/i18n/ru'
import {
  heartbeatLobbyPresence,
  getLobbyPresence,
  leaveLobbyPresence,
  type LobbyPresenceEntry,
} from '@/server/actions/lobby-presence'

const t = ru.lobby

// Lobby ground is 60×60. Keep player inside the playable inner ~24×24 area
// so they don't walk past the trees/doors.
const HALF_BOUND_X = 24
const HALF_BOUND_Z = 24

// Portal is anchored at the first door (NW corner of the map). Position is
// taken from the extracted scene data; portal sits on the ground a few units
// in front of the door so the player walks INTO it from the playable area.
const PORTAL_DOOR = LOBBY_SCENE_INSTANCES.find((i) => i.label === 'Door.glb')!
const PORTAL_RADIUS = 2.4
const PORTAL_INNER = 1.05
const PORTAL_OUTER = 1.55

function arenaPortalPosition(): [number, number, number] {
  const [dx, , dz] = PORTAL_DOOR.position
  // Pull the portal a few units back from the door toward the lobby centre so
  // the kid steps into it while approaching the door.
  const len = Math.hypot(dx, dz) || 1
  const nx = dx / len
  const nz = dz / len
  const back = 4
  return [dx - nx * back, 0.05, dz - nz * back]
}

interface LobbyArenaPortalProps {
  position: [number, number, number]
  onSetNear: (b: boolean) => void
}

function LobbyArenaPortal({ position, onSetNear }: LobbyArenaPortalProps) {
  const wasNear = useRef(false)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const dx = px - position[0]
    const dz = pz - position[2]
    const distSq = dx * dx + dz * dz
    const isNear = distSq < PORTAL_RADIUS * PORTAL_RADIUS

    if (isNear !== wasNear.current) {
      wasNear.current = isNear
      onSetNear(isNear)
    }

    if (ringRef.current) {
      const tnow = performance.now() / 1000
      const pulse = 1 + Math.sin(tnow * 2.4) * 0.08
      ringRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={position}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[PORTAL_INNER, PORTAL_OUTER, 48]} />
        <meshBasicMaterial color="#FFD86E" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.55, 1.05, 48]} />
        <meshBasicMaterial color="#FFD86E" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>

      <Billboard follow position={[0, 1.6, 0]}>
        <Text
          fontSize={0.55}
          color="#1F2937"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#FFFFFF"
          maxWidth={6}
        >
          {t.enterArena}
        </Text>
      </Billboard>
    </group>
  )
}

interface LobbyWorldProps {
  gender: CharacterGender
}

const HEARTBEAT_INTERVAL_MS = 600
const PRESENCE_POLL_INTERVAL_MS = 1000

export function LobbyWorld({ gender }: LobbyWorldProps) {
  const router = useRouter()
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)
  const [nearArenaPortal, setNearArenaPortal] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [remotePlayers, setRemotePlayers] = useState<LobbyPresenceEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const portalPos = useMemo(() => arenaPortalPosition(), [])

  useEffect(() => {
    setBounds(HALF_BOUND_X, HALF_BOUND_Z)
    setPosition(0, 0, 0)
    setCameraDistance(11)
    setCameraPitch(0.7)
    setCameraYaw(0)
  }, [setBounds, setPosition, setCameraDistance, setCameraPitch, setCameraYaw])

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  useSceneInput(containerRef)

  // Heartbeat — push the local player's position to the server so other lobby
  // visitors can see us. Reads position straight from the store on each tick.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      const [px, , pz] = useGameStore.getState().position
      try {
        await heartbeatLobbyPresence({ x: px, z: pz })
      } catch {
        // Network blip — try again next tick.
      }
    }
    void tick()
    const id = window.setInterval(tick, HEARTBEAT_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
      void leaveLobbyPresence().catch(() => {})
    }
  }, [])

  // Poll other players' positions.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try {
        const entries = await getLobbyPresence()
        if (!cancelled) setRemotePlayers(entries)
      } catch {
        // ignore transient errors
      }
    }
    void tick()
    const id = window.setInterval(tick, PRESENCE_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100dvw',
        height: '100dvh',
        overflow: 'hidden',
        background: '#A8DCFF',
        touchAction: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 8, 12], fov: 45, near: 0.1, far: 400 }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ background: '#A8DCFF' }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[15, 25, 10]} intensity={1.0} />
        <hemisphereLight args={['#dfefff', '#5b8a6a', 0.4]} />
        <CameraRig />
        <LobbyScene />
        <LobbyArenaPortal position={portalPos} onSetNear={setNearArenaPortal} />
        <CharacterGLB gender={gender} />
        {remotePlayers.map((p) => (
          <RemoteLobbyPlayer
            key={p.childId}
            displayName={p.displayName}
            gender={p.gender}
            targetPosition={[p.x, p.z]}
          />
        ))}
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

      {nearArenaPortal && (
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
