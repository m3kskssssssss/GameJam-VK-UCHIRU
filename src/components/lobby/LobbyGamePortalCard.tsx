'use client'
// Floating config card shown over the 3D lobby when the player approaches a
// game portal. Lets the child pick an opponent (purely informational + the
// chosen friend's name shows in the game HUD) and start the round, which
// debits energy and routes to the game page.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Play } from 'lucide-react'
import {
  startLobbyGame,
  listOnlineFriends,
  type OnlineFriend,
} from '@/server/actions/lobby-games'
import { type LobbyGame } from '@/components/world/lobby-games-data'
import { CoinIcon, EnergyIcon } from '@/components/ui/icons'
import { ru } from '@/i18n/ru'

const t = ru.lobbyGames

export interface LobbyGamePortalCardProps {
  game: LobbyGame
  onClose: () => void
}

type Mode =
  | { kind: 'solo' }
  | { kind: 'anyone' }
  | { kind: 'friend'; childId: string; displayName: string }

export function LobbyGamePortalCard({ game, onClose }: LobbyGamePortalCardProps) {
  const router = useRouter()
  const [friends, setFriends] = useState<OnlineFriend[]>([])
  const [mode, setMode] = useState<Mode>({ kind: 'solo' })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    listOnlineFriends()
      .then((list) => {
        if (!cancelled) setFriends(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function handleStart() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await startLobbyGame({ gameId: game.id })
        if (!res.ok) {
          setError(t.cardNoEnergy)
          return
        }
        const params = new URLSearchParams()
        if (mode.kind === 'friend') {
          params.set('opponent', mode.displayName)
          params.set('opponentId', mode.childId)
        } else if (mode.kind === 'anyone') {
          params.set('opponent', t.cardAnyone)
        }
        const qs = params.toString()
        router.push(`${game.route}${qs ? `?${qs}` : ''}`)
      } catch {
        setError(t.cardNoEnergy)
      }
    })
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '4.2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(90vw, 380px)',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 18,
        boxShadow: '0 12px 40px rgba(31,41,55,0.25), 0 4px 12px rgba(31,41,55,0.12)',
        padding: '1rem 1.1rem 0.9rem',
        zIndex: 40,
        fontFamily: 'Nunito, sans-serif',
        color: '#1F2937',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: game.color,
            boxShadow: `0 0 10px ${game.color}`,
          }}
        />
        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0 }}>{game.title}</h3>
        <button
          onClick={onClose}
          aria-label={t.cardClose}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <p style={{ fontSize: '0.86rem', color: '#4B5563', margin: '0 0 0.7rem' }}>
        {game.short}
      </p>

      <div style={{ marginBottom: '0.7rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>
          {t.cardOpponent}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip
            active={mode.kind === 'solo'}
            label={t.cardSolo}
            onClick={() => setMode({ kind: 'solo' })}
          />
          <Chip
            active={mode.kind === 'anyone'}
            label={t.cardAnyone}
            onClick={() => setMode({ kind: 'anyone' })}
          />
          {friends.map((f) => (
            <Chip
              key={f.childId}
              active={mode.kind === 'friend' && mode.childId === f.childId}
              label={f.displayName}
              onClick={() =>
                setMode({ kind: 'friend', childId: f.childId, displayName: f.displayName })
              }
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: '#374151',
          marginBottom: 8,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <EnergyIcon size={16} /> {t.cardCost}: −{game.energyCost}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#9CA3AF' }}>
          <CoinIcon size={16} /> +{game.coinsParticipation} … +
          {game.coinsParticipation + game.coinsVictory}
        </span>
      </div>

      {error && (
        <p
          style={{
            margin: '0 0 8px',
            color: '#B91C1C',
            fontSize: '0.82rem',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        style={{
          width: '100%',
          minHeight: 52,
          background: game.color,
          border: 'none',
          color: '#1F2937',
          fontWeight: 900,
          fontSize: '1.02rem',
          borderRadius: 14,
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: `0 6px 18px ${game.color}55`,
        }}
      >
        <Play size={18} />
        {t.cardStart}
      </button>
    </div>
  )
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: active ? '2px solid #1F2937' : '2px solid transparent',
        background: active ? '#1F2937' : '#F3F4F6',
        color: active ? '#FFFFFF' : '#374151',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
