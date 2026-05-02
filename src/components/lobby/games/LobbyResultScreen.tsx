'use client'
// Shared result screen for the 4 lobby mini-games.
// Calls finishLobbyGame on mount to credit coins + XP and report what was
// granted, then offers Play-again / Back-to-lobby actions.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Coins, Zap, RotateCcw, Home } from 'lucide-react'
import { finishLobbyGame } from '@/server/actions/lobby-games'
import type { LobbyGameId } from '@/components/world/lobby-games-data'
import { ru } from '@/i18n/ru'

const t = ru.lobbyGames

export interface LobbyResultScreenProps {
  gameId: LobbyGameId
  score: number
  won: boolean
  opponentName?: string | null
  onPlayAgain: () => void
}

export function LobbyResultScreen({
  gameId,
  score,
  won,
  opponentName,
  onPlayAgain,
}: LobbyResultScreenProps) {
  const router = useRouter()
  const [reward, setReward] = useState<{ coins: number; xp: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    finishLobbyGame({ gameId, score, won })
      .then((res) => {
        if (cancelled) return
        setReward({ coins: res.coinsEarned, xp: res.xpEarned })
      })
      .catch(() => {
        if (cancelled) return
        setError('Не удалось сохранить результат.')
      })
    return () => {
      cancelled = true
    }
  }, [gameId, score, won])

  function handleBack() {
    router.push('/play/lobby')
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 60,
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(92vw, 380px)',
          background: '#FFF9F0',
          borderRadius: 18,
          padding: '1.4rem 1.2rem 1.2rem',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          color: '#1F2937',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: won ? '#6BCB77' : '#FFB347',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.8rem',
            boxShadow: '0 6px 16px rgba(31,41,55,0.18)',
          }}
        >
          <Trophy size={40} color="white" strokeWidth={2.4} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.2rem' }}>
          {won ? t.resultPassed : t.resultParticipated}
        </h2>
        <p style={{ margin: '0 0 0.8rem', color: '#4B5563', fontWeight: 700 }}>
          {t.hudScore}: {score}
        </p>

        {opponentName && (
          <p style={{ margin: '0 0 0.6rem', color: '#6B7280', fontSize: '0.85rem' }}>
            {t.hudOpponent}: <strong>{opponentName}</strong>
          </p>
        )}

        {reward && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <Pill colour="#FB923C">
              <Coins size={16} /> +{reward.coins}
            </Pill>
            <Pill colour="#4DA8DA">
              <Zap size={16} /> +{reward.xp} XP
            </Pill>
          </div>
        )}

        {error && (
          <p style={{ margin: '0 0 0.6rem', color: '#B91C1C', fontWeight: 700 }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={onPlayAgain}
            style={{
              minHeight: 48,
              background: '#4DA8DA',
              border: 'none',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={18} /> {t.resultPlayAgain}
          </button>
          <button
            type="button"
            onClick={handleBack}
            style={{
              minHeight: 48,
              background: '#FFFFFF',
              border: '2px solid #C9C0AE',
              color: '#1F2937',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Home size={18} /> {t.resultBackToLobby}
          </button>
        </div>
      </div>
    </div>
  )
}

function Pill({ colour, children }: { colour: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        background: colour,
        color: '#fff',
        padding: '6px 14px',
        borderRadius: 999,
        fontWeight: 800,
        fontSize: '0.9rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {children}
    </span>
  )
}
