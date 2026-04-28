'use client'
// Phase 7 — Arena client component.
// Polls match state every 300 ms, handles keyboard/touch input.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMatchState,
  startMatch,
  movePlayer,
  leaveMatch,
  joinOrCreateMatch,
} from '@/server/actions/lobby'
import type { MatchState } from '@/server/actions/lobby-helpers'
import { MatchBoard } from '@/components/lobby/MatchBoard'
import { Scoreboard } from '@/components/lobby/Scoreboard'
import { MoveButtons } from '@/components/lobby/MoveButtons'
import { ru } from '@/i18n/ru'

const t = ru.lobby

const POLL_INTERVAL = 300
const MOVE_THROTTLE_MS = 80

interface Props {
  matchId: string
  initialState: MatchState
}

export function Arena({ matchId, initialState }: Props) {
  const [state, setState] = useState<MatchState>(initialState)
  const router = useRouter()
  const mountedRef = useRef(true)
  const lastMoveRef = useRef(0)
  const pendingMoveRef = useRef<{ dx: -1 | 0 | 1; dy: -1 | 0 | 1 } | null>(null)

  // Optimistic local position for the current player
  const [localPos, setLocalPos] = useState<{ x: number; y: number }>({
    x: initialState.me.x,
    y: initialState.me.y,
  })

  // Polling loop
  useEffect(() => {
    mountedRef.current = true
    const interval = setInterval(async () => {
      if (!mountedRef.current) return
      try {
        const next = await getMatchState({ matchId })
        if (mountedRef.current) {
          setState(next)
          setLocalPos({ x: next.me.x, y: next.me.y })
        }
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [matchId])

  const sendMove = useCallback(
    async (dx: -1 | 0 | 1, dy: -1 | 0 | 1) => {
      const now = Date.now()
      if (now - lastMoveRef.current < MOVE_THROTTLE_MS) {
        pendingMoveRef.current = { dx, dy }
        return
      }
      lastMoveRef.current = now
      // Optimistic update
      setLocalPos((prev) => ({
        x: Math.max(0, Math.min(11, prev.x + dx)),
        y: Math.max(0, Math.min(7, prev.y + dy)),
      }))
      try {
        await movePlayer({ matchId, dx, dy })
      } catch {
        // server will reconcile on next poll
      }
    },
    [matchId],
  )

  // Keyboard controls (desktop)
  useEffect(() => {
    if (state.status !== 'ACTIVE') return
    const handleKey = (e: KeyboardEvent) => {
      let dx: -1 | 0 | 1 = 0
      let dy: -1 | 0 | 1 = 0
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1
          break
        default:
          return
      }
      e.preventDefault()
      void sendMove(dx, dy)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [state.status, sendMove])

  // Flush pending move after throttle window
  useEffect(() => {
    const interval = setInterval(() => {
      const pending = pendingMoveRef.current
      if (pending) {
        pendingMoveRef.current = null
        void sendMove(pending.dx, pending.dy)
      }
    }, MOVE_THROTTLE_MS)
    return () => clearInterval(interval)
  }, [sendMove])

  async function handleStart() {
    try {
      await startMatch({ matchId })
    } catch {
      // already started — next poll will update status
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
    setLocalPos({ x: next.me.x, y: next.me.y })
    router.refresh()
  }

  // Merge local optimistic position into state for rendering
  const displayState: MatchState = {
    ...state,
    me: { ...state.me, x: localPos.x, y: localPos.y },
    players: state.players.map((p) =>
      p.childId === state.me.childId
        ? { ...p, x: localPos.x, y: localPos.y }
        : p,
    ),
  }

  if (state.status === 'WAITING') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-2xl font-extrabold">{t.waiting}</h2>
        <p className="text-gray-400">
          {t.playersInLobby}: {state.players.length}
        </p>
        <ul className="flex flex-col gap-1">
          {state.players.map((p) => (
            <li key={p.childId} className="rounded-lg bg-white/10 px-4 py-1 text-sm">
              {p.displayName}
            </li>
          ))}
        </ul>
        <button
          onClick={() => void handleStart()}
          className="rounded-xl bg-green-500 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition hover:bg-green-600 active:scale-95"
        >
          {t.startCta}
        </button>
        <button
          onClick={() => void handleLeave()}
          className="text-sm text-gray-400 underline"
        >
          {t.leave}
        </button>
      </div>
    )
  }

  if (state.status === 'FINISHED') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-2xl font-extrabold">{t.finished}</h2>
        {state.leaderboard && (
          <ol className="flex flex-col gap-2 w-full max-w-xs">
            {state.leaderboard.map((entry, i) => (
              <li
                key={entry.childId}
                className={`flex items-center justify-between rounded-xl px-4 py-2 ${
                  entry.childId === state.me.childId
                    ? 'bg-blue-500 font-bold'
                    : 'bg-white/10'
                }`}
              >
                <span>
                  {i + 1}. {entry.displayName}
                </span>
                <span>
                  {entry.score} pts · {entry.coinsEarned} {t.rewardCoins}
                </span>
              </li>
            ))}
          </ol>
        )}
        <button
          onClick={() => void handlePlayAgain()}
          className="rounded-xl bg-green-500 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition hover:bg-green-600 active:scale-95"
        >
          {t.playAgain}
        </button>
        <button
          onClick={() => void handleLeave()}
          className="rounded-xl bg-white/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
        >
          {t.leave}
        </button>
      </div>
    )
  }

  // ACTIVE
  return (
    <div className="flex flex-1 flex-col gap-2 p-2">
      <Scoreboard state={displayState} />
      <MatchBoard state={displayState} />
      <p className="text-center text-xs text-gray-400">{t.controlsHint}</p>
      <MoveButtons onMove={sendMove} />
    </div>
  )
}
