'use client'
// 3D lobby scene — uses the GLB-based scene exported from for-lobby/Scene.zcomp
// (lobbymap.png ground + bushes/trees/grass/doors). Player walks around with
// the same 3D character used in /play. Each of the 4 corner doors carries a
// portal for one of the lobby mini-games (forest / reaction / memory / pairs).
//
// Multi-player presence is unchanged — heartbeats + poll for nearby children.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import { CameraRig } from './CameraRig'
import { CharacterGLB, type CharacterGender } from './CharacterGLB'
import { Joystick } from './Joystick'
import { LobbyScene } from './LobbyScene'
import { BorderForest } from './BorderForest'
import { SceneLights } from './SceneLights'
import { RemoteLobbyPlayer, type RemoteSnapshot } from './RemoteLobbyPlayer'
import {
  LOBBY_GAMES,
  portalPositionFor,
  type LobbyGame,
  type LobbyGameId,
} from './lobby-games-data'
import { ActionButtons } from '@/components/play/ActionButtons'
import { AmbientAudio } from '@/components/play/AmbientAudio'
import { LobbyGamePortalCard } from '@/components/lobby/LobbyGamePortalCard'
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

// Lobby ground is 60×60. Keep the player inside the playable inner ~24×24
// area so they don't walk past the trees/doors.
const HALF_BOUND_X = 24
const HALF_BOUND_Z = 24

const WALK_SPEED = 4
const RUN_MULTIPLIER = 2

const HEARTBEAT_INTERVAL_MS = 400
const PRESENCE_POLL_INTERVAL_MS = 500

// Portal visuals match /play: white semi-transparent disc on the ground,
// soft halo ring, white plaque label sprite-billboarded above. The proximity
// trigger radius is the same as /play's TRIGGER_RADIUS so the lobby and play
// worlds feel identical when walking up to a portal.
const TRIGGER_RADIUS = 2.0
const DISC_RADIUS = 1.4
const RING_INNER = 1.45
const RING_OUTER = 1.7
const LABEL_HEIGHT = 2.24

interface GamePortalProps {
  game: LobbyGame
  position: [number, number, number]
  onSetNear: (id: LobbyGameId | null) => void
}

function GamePortal({ game, position, onSetNear }: GamePortalProps) {
  const wasNear = useRef(false)
  const discRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const dx = px - position[0]
    const dz = pz - position[2]
    const distSq = dx * dx + dz * dz
    const isNear = distSq < TRIGGER_RADIUS * TRIGGER_RADIUS

    if (isNear !== wasNear.current) {
      wasNear.current = isNear
      onSetNear(isNear ? game.id : null)
    }

    if (discRef.current) {
      const tnow = performance.now() / 1000
      const pulse = 1 + Math.sin(tnow * 2.4) * 0.05
      discRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={position}>
      {/* White semi-transparent disc flat on XZ plane */}
      <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[DISC_RADIUS, 48]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* Soft halo ring around the disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[RING_INNER, RING_OUTER, 48]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>

      {/* Html label — always faces camera, styled as a white rounded plaque */}
      <Html
        center
        distanceFactor={8}
        sprite
        position={[0, LABEL_HEIGHT, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            borderRadius: 14,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 8px 24px rgba(31,41,55,0.18), 0 2px 8px rgba(31,41,55,0.10)',
            padding: '8px 18px',
            font: '800 16px/1.1 Nunito, sans-serif',
            color: '#1F2937',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {game.title}
        </div>
      </Html>
    </group>
  )
}

interface LobbyWorldProps {
  gender: CharacterGender
}

type RemoteState = {
  childId: string
  displayName: string
  gender: 'BOY' | 'GIRL'
  snapshot: RemoteSnapshot
}

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

  // Which portal the player is currently standing in (proximity), and which
  // one's config card is open (set on click of the bottom CTA).
  const [nearGameId, setNearGameId] = useState<LobbyGameId | null>(null)
  const [openGameId, setOpenGameId] = useState<LobbyGameId | null>(null)

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [remotePlayers, setRemotePlayers] = useState<RemoteState[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const clockOffsetRef = useRef<number>(0)

  const portals = useMemo(
    () => LOBBY_GAMES.map((g) => ({ game: g, position: portalPositionFor(g) })),
    [],
  )

  useEffect(() => {
    setBounds(HALF_BOUND_X, HALF_BOUND_Z)
    setPosition(0, 0, 0)
    setCameraDistance(8)
    setCameraPitch(0.55)
    setCameraYaw(0)
  }, [setBounds, setPosition, setCameraDistance, setCameraPitch, setCameraYaw])

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  // Prefetch every game route so opening one feels instant.
  useEffect(() => {
    router.prefetch('/play')
    LOBBY_GAMES.forEach((g) => router.prefetch(g.route))
  }, [router])

  useSceneInput(containerRef)

  // If the player walks away from the portal, close any open card.
  useEffect(() => {
    if (openGameId && nearGameId !== openGameId) {
      setOpenGameId(null)
    }
  }, [nearGameId, openGameId])

  // Heartbeat — broadcast position + velocity + facing.
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
        clockOffsetRef.current = res.serverTimeMs - Date.now()
      } catch {
        // ignore transient errors
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

  // Poll other players' snapshots.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try {
        const { entries, serverTimeMs } = await getLobbyPresence()
        if (cancelled) return
        clockOffsetRef.current = serverTimeMs - Date.now()
        const localPerfNow = performance.now()
        const localDateNow = Date.now()
        const next: RemoteState[] = entries.map((e: LobbyPresenceEntry) => {
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
        // ignore
      }
    }
    void tick()
    const id = window.setInterval(tick, PRESENCE_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const nearGame = nearGameId ? LOBBY_GAMES.find((g) => g.id === nearGameId) ?? null : null
  const openGame = openGameId ? LOBBY_GAMES.find((g) => g.id === openGameId) ?? null : null

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
        {portals.map(({ game, position }) => (
          <GamePortal
            key={game.id}
            game={game}
            position={position}
            onSetNear={(id) =>
              setNearGameId((prev) => {
                if (id === null) return prev === game.id ? null : prev
                return id
              })
            }
          />
        ))}
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

      {/* Bottom CTA — opens the config card. Styled like /play's "Войти в домик"
          button (white plaque, dark text) for visual consistency. */}
      {nearGame && !openGame && (
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setOpenGameId(nearGame.id)}
            style={{
              padding: '1rem 2.5rem',
              background: 'rgba(255,255,255,0.96)',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#1F2937',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              boxShadow:
                '0 8px 24px rgba(31,41,55,0.18), 0 2px 8px rgba(31,41,55,0.10)',
              letterSpacing: '0.01em',
              transition: 'transform 0.15s ease',
            }}
          >
            {nearGame.title}
          </button>
        </div>
      )}

      {openGame && (
        <LobbyGamePortalCard game={openGame} onClose={() => setOpenGameId(null)} />
      )}

      <ActionButtons />
      <AmbientAudio src="/village.mp3" />
      {isTouchDevice && <Joystick />}
    </div>
  )
}
