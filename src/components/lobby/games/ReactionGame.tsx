'use client'
// "Реакция" — 30s 2D mini-game. Coloured circles pop in random spots; tap
// green ones to score, red ones cost a point. Win at 10+ score.

import { useEffect, useRef, useState } from 'react'
import { Coins } from 'lucide-react'
import { gameById } from '@/components/world/lobby-games-data'
import { LobbyResultScreen } from './LobbyResultScreen'
import { ru } from '@/i18n/ru'

const t = ru.lobbyGames

const ROUND_MS = 30_000
const SPAWN_MIN = 380
const SPAWN_MAX = 800
const TARGET_LIFE_MS = 1300
const MAX_TARGETS = 4

interface Target {
  id: number
  x: number
  y: number
  good: boolean
  spawnedAt: number
}

let nextTargetId = 1

interface ReactionGameProps {
  opponentName?: string
}

export function ReactionGame({ opponentName }: ReactionGameProps) {
  const [phase, setPhase] = useState<'playing' | 'result'>('playing')
  const [score, setScore] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_MS)
  const [targets, setTargets] = useState<Target[]>([])
  const startedAtRef = useRef<number>(performance.now())
  const areaRef = useRef<HTMLDivElement>(null)

  const game = gameById('reaction')

  // Timer.
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

  // Spawner — schedule one target after a random delay; stops after time runs out.
  useEffect(() => {
    if (phase !== 'playing') return
    let cancelled = false
    function loop() {
      if (cancelled) return
      const delay = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN)
      window.setTimeout(() => {
        if (cancelled) return
        const area = areaRef.current
        if (!area) return loop()
        const rect = area.getBoundingClientRect()
        const margin = 40
        const t: Target = {
          id: nextTargetId++,
          x: margin + Math.random() * Math.max(0, rect.width - margin * 2),
          y: margin + Math.random() * Math.max(0, rect.height - margin * 2),
          good: Math.random() > 0.25,
          spawnedAt: performance.now(),
        }
        setTargets((prev) => (prev.length >= MAX_TARGETS ? prev : [...prev, t]))
        loop()
      }, delay)
    }
    loop()
    return () => {
      cancelled = true
    }
  }, [phase])

  // Expire targets that lived too long (turn green into ghost, remove).
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      const now = performance.now()
      setTargets((prev) => prev.filter((tg) => now - tg.spawnedAt < TARGET_LIFE_MS))
    }, 120)
    return () => window.clearInterval(id)
  }, [phase])

  function handleTap(target: Target) {
    setTargets((prev) => prev.filter((tg) => tg.id !== target.id))
    setScore((s) => Math.max(0, s + (target.good ? 1 : -1)))
  }

  function handlePlayAgain() {
    setScore(0)
    setTargets([])
    setTimeLeftMs(ROUND_MS)
    startedAtRef.current = performance.now()
    setPhase('playing')
  }

  const won = score >= game.winThreshold

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #FCE7E7 0%, #FBD2D2 100%)',
        fontFamily: 'Nunito, sans-serif',
        color: '#1F2937',
      }}
    >
      <Header
        timeLeftSec={Math.ceil(timeLeftMs / 1000)}
        score={score}
        opponentName={opponentName}
      />

      <div
        ref={areaRef}
        style={{
          position: 'absolute',
          top: 80,
          left: 12,
          right: 12,
          bottom: 60,
          background: 'rgba(255,255,255,0.5)',
          borderRadius: 18,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {targets.map((tg) => (
          <Bubble key={tg.id} target={tg} onClick={() => handleTap(tg)} />
        ))}
      </div>

      <Hint>{t.reactionStartHint}</Hint>

      {phase === 'result' && (
        <LobbyResultScreen
          gameId="reaction"
          score={score}
          won={won}
          opponentName={opponentName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

function Bubble({ target, onClick }: { target: Target; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        left: target.x - 32,
        top: target.y - 32,
        width: 64,
        height: 64,
        borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.8)',
        background: target.good ? '#5BC675' : '#E76F6F',
        boxShadow: '0 6px 16px rgba(31,41,55,0.25)',
        cursor: 'pointer',
        animation: 'bubblePop 200ms ease-out',
        padding: 0,
      }}
      aria-label={target.good ? '+1' : '-1'}
    >
      <style>{`@keyframes bubblePop { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
    </button>
  )
}

function Header({
  timeLeftSec,
  score,
  opponentName,
}: {
  timeLeftSec: number
  score: number
  opponentName?: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        zIndex: 5,
      }}
    >
      <PanelStack>
        <Panel label={t.hudTimeLeft} value={`${timeLeftSec} с`} accent={timeLeftSec <= 5 ? '#B91C1C' : '#1F2937'} />
      </PanelStack>
      <PanelStack alignRight>
        <Panel
          label={t.hudScore}
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Coins size={18} color="#FB923C" /> {score}
            </span>
          }
        />
        {opponentName && <Panel label={t.hudOpponent} value={opponentName} small />}
      </PanelStack>
    </div>
  )
}

function PanelStack({
  children,
  alignRight,
}: {
  children: React.ReactNode
  alignRight?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: alignRight ? 'flex-end' : 'flex-start',
      }}
    >
      {children}
    </div>
  )
}

function Panel({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: React.ReactNode
  accent?: string
  small?: boolean
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.92)',
        padding: small ? '4px 10px' : '6px 14px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(31,41,55,0.12)',
      }}
    >
      <div style={{ fontSize: '0.65rem', color: '#6B7280', fontWeight: 700 }}>{label}</div>
      <div
        style={{
          fontSize: small ? '0.85rem' : '1.05rem',
          fontWeight: 900,
          color: accent ?? '#1F2937',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#4B5563',
        fontSize: '0.85rem',
        fontWeight: 700,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  )
}
