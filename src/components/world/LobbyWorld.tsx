'use client'
// 3D lobby scene — uses the GLB-based scene exported from for-lobby/Scene.zcomp
// (lobbymap.png ground + bushes/trees/grass/doors). Player walks around with
// the same 3D character used in /play. One of the 4 doors is wrapped in a
// glowing portal that pushes the player into the multi-player arena.
//
// Multi-player presence: every ~400ms we POST a heartbeat with our position +
// world-space velocity + facing yaw + run/jump flags. Every ~500ms we poll
// the server for everyone else's last snapshot. Remote players are rendered
// by RemoteLobbyPlayer which extrapolates the snapshot forward in time and
// lerps the visual transform — so movement looks continuous despite the
// half-second poll cadence.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { CameraRig } from './CameraRig'
import { CharacterGLB, type CharacterGender } from './CharacterGLB'
import { Joystick } from './Joystick'
import { LobbyScene } from './LobbyScene'
import { LOBBY_SCENE_INSTANCES } from './lobby-scene-data'
import { BorderForest } from './BorderForest'
import { SceneLights } from './SceneLights'
import { RemoteLobbyPlayer, type RemoteSnapshot } from './RemoteLobbyPlayer'
import { ActionButtons } from '@/components/play/ActionButtons'
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

// Movement constants — must mirror useGameStore so we can reconstruct the
// player's instantaneous world-space velocity from input direction + yaw.
const WALK_SPEED = 4
const RUN_MULTIPLIER = 2

// Heartbeat / poll cadence. 400/500 ms keeps DB writes light while feeling
// near-real-time once velocity prediction kicks in on the receiver.
const HEARTBEAT_INTERVAL_MS = 400
const PRESENCE_POLL_INTERVAL_MS = 500

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

// Per-player snapshot map. Keyed by childId; new snapshots replace the old.
type RemoteState = {
  childId: string
  displayName: string
  gender: 'BOY' | 'GIRL'
  snapshot: RemoteSnapshot
}

// Compute the local player's world-space velocity (units/sec) from the
// store's normalised input direction, camera yaw, and run flag.
function computeWorldVelocity(): { vx: number; vz: number } {
  const s = useGameStore.getState()
  const [ix, iz] = s.velocity
  if (ix === 0 && iz === 0) return { vx: 0, vz: 0 }
  const yaw = s.cameraYaw
  const sy = Math.sin(yaw)
  const cy = Math.cos(yaw)
  const forwardInput = -iz
  const rightInput = ix
  const dx = -sy * forwardInput + cy * rightInput
  const dz = -cy * forwardInput - sy * rightInput
  const speed = s.isRunning ? WALK_SPEED * RUN_MULTIPLIER : WALK_SPEED
  return { vx: dx * speed, vz: dz * speed }
}

export function LobbyWorld({ gender }: LobbyWorldProps) {
  const router = useRouter()
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)
  const [nearArenaPortal, setNearArenaPortal] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [remotePlayers, setRemotePlayers] = useState<RemoteState[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Local-clock offset to the server clock (server t - local t at receive).
  // Lets us translate server timestamps to local performance.now() so the
  // remote players' "received at" reference is consistent with our frame loop.
  const clockOffsetRef = useRef<number>(0)

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

  // Prefetch the routes the lobby buttons can navigate to so the click
  // doesn't have to wait for RSC payloads to arrive on first press.
  useEffect(() => {
    router.prefetch('/play')
    router.prefetch('/play/lobby/arena')
  }, [router])

  useSceneInput(containerRef)

  // Heartbeat — push the local player's position + velocity + facing + flags.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      const s = useGameStore.getState()
      const [px, , pz] = s.position
      const { vx, vz } = computeWorldVelocity()
      try {
        const res = await heartbeatLobbyPresence({
          x: px,
          z: pz,
          yaw: s.playerYaw,
          vx,
          vz,
          isRunning: s.isRunning,
          isJumping: !s.isGrounded,
        })
        // Sync local→server clock offset so we can translate updatedAtMs.
        clockOffsetRef.current = res.serverTimeMs - Date.now()
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

  // Poll other players' snapshots and turn them into RemoteState entries.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try {
        const { entries, serverTimeMs } = await getLobbyPresence()
        if (cancelled) return
        // Refine the clock offset on every poll for stability.
        clockOffsetRef.current = serverTimeMs - Date.now()
        // Translate each row's server-stamped updatedAtMs to local
        // performance.now() — that's what RemoteLobbyPlayer extrapolates from.
        const localPerfNow = performance.now()
        const localDateNow = Date.now()
        const next: RemoteState[] = entries.map((e: LobbyPresenceEntry) => {
          // Server time → local Date.now() → performance.now() reference.
          const localDate = e.updatedAtMs - clockOffsetRef.current
          const ageMs = Math.max(0, localDateNow - localDate)
          const receivedAtMs = localPerfNow - ageMs
          return {
            childId: e.childId,
            displayName: e.displayName,
            gender: e.gender,
            snapshot: {
              x: e.x,
              z: e.z,
              yaw: e.yaw,
              vx: e.vx,
              vz: e.vz,
              isRunning: e.isRunning,
              isJumping: e.isJumping,
              receivedAtMs,
            },
          }
        })
        setRemotePlayers(next)
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
        shadows="soft"
        style={{ background: '#A8DCFF' }}
      >
        <SceneLights size={60} />
        <CameraRig />
        <LobbyScene />
        <BorderForest tileSize={60} />
        <LobbyArenaPortal position={portalPos} onSetNear={setNearArenaPortal} />
        <CharacterGLB gender={gender} />
        {remotePlayers.map((p) => (
          <RemoteLobbyPlayer
            key={p.childId}
            displayName={p.displayName}
            gender={p.gender}
            snapshot={p.snapshot}
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

      <ActionButtons />
      {isTouchDevice && <Joystick />}
    </div>
  )
}
