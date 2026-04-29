'use client'
// Top-level arena client component for the 3D coin-collection mini-game.
// Owns: server polling, position broadcasting, phase UI (WAITING/ACTIVE/FINISHED).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMatchState,
  startMatch,
  setPlayerPosition,
  leaveMatch,
  joinOrCreateMatch,
} from '@/server/actions/lobby'
import type { MatchState } from '@/server/actions/lobby-helpers'
import { ArenaWorld } from './ArenaWorld'
import { Joystick } from '@/components/world/Joystick'
import { RotationJoystick } from '@/components/world/RotationJoystick'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import { ru } from '@/i18n/ru'

const t = ru.lobby

const POLL_INTERVAL = 450

interface Props {
  matchId: string
  initialState: MatchState
}

export function Arena({ matchId, initialState }: Props) {
  const [state, setState] = useState<MatchState>(initialState)
  const [hiddenCoinIds, setHiddenCoinIds] = useState<Set<string>>(new Set())
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const router = useRouter()
  const mountedRef = useRef(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Init local game store (position, bounds, camera) ─────────────────────
  const setBounds = useGameStore((s) => s.setBounds)
  const setPosition = useGameStore((s) => s.setPosition)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)

  useEffect(() => {
    setBounds(11.5, 7.5)
    setPosition(initialState.me.x, 0, initialState.me.y)
    setCameraDistance(11)
    setCameraPitch(0.7)
    setCameraYaw(0)
  }, [
    initialState.me.x,
    initialState.me.y,
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

  // ── Polling — fetch match state ───────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    const interval = setInterval(async () => {
      if (!mountedRef.current) return
      try {
        const next = await getMatchState({ matchId })
        if (!mountedRef.current) return
        setState(next)
        // After a fresh poll, drop locally-hidden coin ids that the server
        // already reports as claimed (or absent).
        setHiddenCoinIds((prev) => {
          if (prev.size === 0) return prev
          const presentIds = new Set(next.tiles.map((tile) => tile.id))
          let changed = false
          const out = new Set<string>()
          prev.forEach((id) => {
            const found = next.tiles.find((tile) => tile.id === id)
            const stillUnclaimed = found && found.stompedById === null && presentIds.has(id)
            if (stillUnclaimed) out.add(id)
            else changed = true
          })
          return changed ? out : prev
        })
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [matchId])

  // ── Position broadcast ────────────────────────────────────────────────────
  const handlePosition = useCallback(
    async (x: number, z: number) => {
      if (state.status !== 'ACTIVE') return
      try {
        const result = await setPlayerPosition({ matchId, x, y: z })
        if (!mountedRef.current) return
        if (result.collectedIds.length > 0) {
          setHiddenCoinIds((prev) => {
            const next = new Set(prev)
            result.collectedIds.forEach((id) => next.add(id))
            return next
          })
          // Optimistically reflect score in our local state for instant UI.
          setState((prev) => ({
            ...prev,
            me: { ...prev.me, score: result.newScore },
            players: prev.players.map((p) =>
              p.childId === prev.me.childId ? { ...p, score: result.newScore } : p,
            ),
          }))
        }
      } catch {
        // ignore — next poll will reconcile
      }
    },
    [matchId, state.status],
  )

  // ── Lifecycle handlers ────────────────────────────────────────────────────
  async function handleStart() {
    try {
      await startMatch({ matchId })
    } catch {
      // ignore — next poll will update status
    }
  }

  async function handleLeave() {
    try {
      await leaveMatch({ matchId })
    } catch {
      // ignore
    }
    router.push('/play/lobby')
  }

  async function handlePlayAgain() {
    try {
      await leaveMatch({ matchId })
    } catch {
      // ignore
    }
    const { matchId: newId } = await joinOrCreateMatch()
    const next = await getMatchState({ matchId: newId })
    setState(next)
    setHiddenCoinIds(new Set())
    router.refresh()
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
      {/* 3D scene always renders during ACTIVE/FINISHED — gives a nice backdrop
          to overlays. During WAITING we skip it for a cleaner lobby screen. */}
      {state.status !== 'WAITING' && (
        <ArenaWorld
          state={state}
          hiddenCoinIds={hiddenCoinIds}
          onPosition={handlePosition}
        />
      )}

      {state.status === 'WAITING' && (
        <WaitingOverlay
          state={state}
          onStart={() => void handleStart()}
          onLeave={() => void handleLeave()}
        />
      )}

      {state.status === 'ACTIVE' && <ActiveOverlay state={state} />}

      {state.status === 'FINISHED' && (
        <FinishedOverlay
          state={state}
          onPlayAgain={() => void handlePlayAgain()}
          onLeave={() => void handleLeave()}
        />
      )}

      {/* Controls only matter during ACTIVE play */}
      {state.status === 'ACTIVE' && isTouchDevice && (
        <>
          <Joystick />
          <RotationJoystick />
        </>
      )}
    </div>
  )
}

// ── Overlays ─────────────────────────────────────────────────────────────

function WaitingOverlay({
  state,
  onStart,
  onLeave,
}: {
  state: MatchState
  onStart: () => void
  onLeave: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #1F2937 0%, #0F172A 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.4rem',
        zIndex: 30,
        fontFamily: 'Nunito, sans-serif',
        padding: '2rem',
      }}
    >
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t.waiting}</h2>
      <p style={{ color: '#9CA3AF' }}>
        {t.playersInLobby}: {state.players.length}
      </p>
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          listStyle: 'none',
          padding: 0,
        }}
      >
        {state.players.map((p) => (
          <li
            key={p.childId}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              fontSize: '0.95rem',
            }}
          >
            {p.displayName}
          </li>
        ))}
      </ul>
      <button
        onClick={onStart}
        style={{
          padding: '0.95rem 2.4rem',
          background: '#22c55e',
          border: 'none',
          borderRadius: 12,
          fontSize: '1.05rem',
          fontWeight: 800,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(34,197,94,0.4)',
        }}
      >
        {t.startCta}
      </button>
      <button
        onClick={onLeave}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#9CA3AF',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        {t.leave}
      </button>
    </div>
  )
}

function ActiveOverlay({ state }: { state: MatchState }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000)
  const sorted = [...state.players].sort((a, b) => b.score - a.score)
  return (
    <>
      {/* Top bar — timer + scores */}
      <div
        style={{
          position: 'absolute',
          top: '0.9rem',
          left: '0.9rem',
          right: '0.9rem',
          display: 'flex',
          gap: '0.7rem',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          zIndex: 20,
          pointerEvents: 'none',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        <div
          style={{
            background: 'rgba(15,23,42,0.7)',
            color: '#fff',
            padding: '0.45rem 0.9rem',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 78,
          }}
        >
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.timeLeft}</span>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: seconds <= 10 ? '#fb7185' : '#fff',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {seconds}
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>сек</span>
        </div>

        <ol
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: 0,
            margin: 0,
            listStyle: 'none',
            justifyContent: 'flex-end',
            maxWidth: '70%',
          }}
        >
          {sorted.map((p, i) => {
            const isMe = p.childId === state.me.childId
            return (
              <li
                key={p.childId}
                style={{
                  background: isMe ? '#4DA8DA' : 'rgba(15,23,42,0.7)',
                  color: '#fff',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ opacity: 0.6 }}>{i + 1}.</span>
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.displayName}
                </span>
                <span style={{ fontWeight: 900 }}>{p.score}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '0.6rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Nunito, sans-serif',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.72rem',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {t.controlsHint}
      </div>
    </>
  )
}

function FinishedOverlay({
  state,
  onPlayAgain,
  onLeave,
}: {
  state: MatchState
  onPlayAgain: () => void
  onLeave: () => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(6px)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.2rem',
        zIndex: 40,
        fontFamily: 'Nunito, sans-serif',
        padding: '2rem',
      }}
    >
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t.finished}</h2>
      {state.leaderboard && (
        <ol
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 0,
            margin: 0,
            listStyle: 'none',
            width: '100%',
            maxWidth: 360,
          }}
        >
          {state.leaderboard.map((entry, i) => {
            const isMe = entry.childId === state.me.childId
            return (
              <li
                key={entry.childId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderRadius: 12,
                  background: isMe ? '#4DA8DA' : 'rgba(255,255,255,0.08)',
                  fontWeight: isMe ? 800 : 600,
                }}
              >
                <span>
                  {i + 1}. {entry.displayName}
                </span>
                <span>
                  {entry.score} pts · {entry.coinsEarned} {t.rewardCoins}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <button
        onClick={onPlayAgain}
        style={{
          padding: '0.95rem 2.4rem',
          background: '#22c55e',
          border: 'none',
          borderRadius: 12,
          fontSize: '1.05rem',
          fontWeight: 800,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(34,197,94,0.4)',
        }}
      >
        {t.playAgain}
      </button>
      <button
        onClick={onLeave}
        style={{
          padding: '0.55rem 1.4rem',
          background: 'rgba(255,255,255,0.18)',
          border: 'none',
          borderRadius: 12,
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        {t.leave}
      </button>
    </div>
  )
}
