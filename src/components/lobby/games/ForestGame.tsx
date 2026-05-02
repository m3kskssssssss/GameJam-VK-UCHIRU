'use client'
// "Лесные монеты" — solo 30-second 3D coin run on a forest backdrop.
// Coins respawn at random positions inside a 16×16 grass clearing surrounded
// by the BorderForest ring. Players walk over a coin to collect it; victory
// is reached at >= forest game's win threshold (8 coins).

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CharacterGLB, type CharacterGender } from '@/components/world/CharacterGLB'
import { CameraRig } from '@/components/world/CameraRig'
import { BorderForest } from '@/components/world/BorderForest'
import { SceneLights } from '@/components/world/SceneLights'
import { Joystick } from '@/components/world/Joystick'
import { ActionButtons } from '@/components/play/ActionButtons'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import { gameById } from '@/components/world/lobby-games-data'
import { LobbyResultScreen } from './LobbyResultScreen'
import { ru } from '@/i18n/ru'

const t = ru.lobbyGames

const ROUND_MS = 30_000
const FIELD_HALF = 7.5
const COIN_RADIUS_SQ = 0.9 * 0.9
const ACTIVE_COINS = 6

interface CoinSpec {
  id: number
  x: number
  z: number
}

let nextCoinId = 1
function spawnCoin(): CoinSpec {
  return {
    id: nextCoinId++,
    x: (Math.random() * 2 - 1) * FIELD_HALF,
    z: (Math.random() * 2 - 1) * FIELD_HALF,
  }
}

interface ForestGameProps {
  gender: CharacterGender
  opponentName?: string
}

export function ForestGame({ gender, opponentName }: ForestGameProps) {
  const setBounds = useGameStore((s) => s.setBounds)
  const setPosition = useGameStore((s) => s.setPosition)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)

  const [coins, setCoins] = useState<CoinSpec[]>(() =>
    Array.from({ length: ACTIVE_COINS }, () => spawnCoin()),
  )
  const [score, setScore] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_MS)
  const [phase, setPhase] = useState<'playing' | 'result'>('playing')
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startedAtRef = useRef<number>(performance.now())

  useEffect(() => {
    setBounds(FIELD_HALF + 0.5, FIELD_HALF + 0.5)
    setPosition(0, 0, 0)
    setCameraDistance(9)
    setCameraPitch(0.6)
    setCameraYaw(0)
  }, [setBounds, setPosition, setCameraDistance, setCameraPitch, setCameraYaw])

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  useSceneInput(containerRef)

  // Tick the timer every 100ms.
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current
      const left = Math.max(0, ROUND_MS - elapsed)
      setTimeLeftMs(left)
      if (left <= 0) {
        window.clearInterval(id)
        setPhase('result')
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase])

  function handlePlayAgain() {
    setCoins(Array.from({ length: ACTIVE_COINS }, () => spawnCoin()))
    setScore(0)
    setTimeLeftMs(ROUND_MS)
    startedAtRef.current = performance.now()
    setPosition(0, 0, 0)
    setPhase('playing')
  }

  const game = gameById('forest')
  const won = score >= game.winThreshold

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
        <SceneLights size={30} />
        <CameraRig />
        <ForestGround />
        <BorderForest tileSize={30} />
        {phase === 'playing' &&
          coins.map((c) => (
            <Coin
              key={c.id}
              spec={c}
              onCollect={(id) => {
                setScore((s) => s + 1)
                setCoins((prev) => prev.filter((c2) => c2.id !== id).concat(spawnCoin()))
              }}
            />
          ))}
        <CharacterGLB gender={gender} />
      </Canvas>

      {/* Top HUD */}
      <div
        style={{
          position: 'absolute',
          top: '0.9rem',
          left: '0.9rem',
          right: '0.9rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          zIndex: 20,
          pointerEvents: 'none',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        <div style={hudPanel}>
          <div style={hudLabel}>{t.hudTimeLeft}</div>
          <div style={hudValue}>{Math.ceil(timeLeftMs / 1000)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <div style={hudPanel}>
            <div style={hudLabel}>{t.hudScore}</div>
            <div style={hudValue}>{score}</div>
          </div>
          {opponentName && (
            <div style={{ ...hudPanel, padding: '4px 10px' }}>
              <div style={{ ...hudLabel, fontSize: '0.65rem' }}>{t.hudOpponent}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{opponentName}</div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '0.6rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.78rem',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          zIndex: 20,
          pointerEvents: 'none',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {t.forestStartHint}
      </div>

      <ActionButtons />
      {isTouchDevice && <Joystick />}

      {phase === 'result' && (
        <LobbyResultScreen
          gameId="forest"
          score={score}
          won={won}
          opponentName={opponentName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

const hudPanel: React.CSSProperties = {
  background: 'rgba(15,23,42,0.7)',
  color: '#fff',
  padding: '0.4rem 0.9rem',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 70,
}
const hudLabel: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.7 }
const hudValue: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }

function ForestGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#7CB342" roughness={1} metalness={0} />
    </mesh>
  )
}

function Coin({ spec, onCollect }: { spec: CoinSpec; onCollect: (id: number) => void }) {
  const ref = useRef<THREE.Group>(null)
  const claimedRef = useRef(false)

  useFrame((s, dt) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += dt * 2.4
    g.position.y = 0.55 + Math.sin(s.clock.elapsedTime * 2.2 + spec.id) * 0.12

    if (claimedRef.current) return
    const [px, , pz] = useGameStore.getState().position
    const dx = px - spec.x
    const dz = pz - spec.z
    if (dx * dx + dz * dz < COIN_RADIUS_SQ) {
      claimedRef.current = true
      onCollect(spec.id)
    }
  })

  return (
    <group ref={ref} position={[spec.x, 0.55, spec.z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 18]} />
        <meshLambertMaterial color="#FFD54F" emissive="#FFB300" emissiveIntensity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.085, 18]} />
        <meshLambertMaterial color="#FFC107" />
      </mesh>
    </group>
  )
}
