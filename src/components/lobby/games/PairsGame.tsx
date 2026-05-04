'use client'
// "Найди пару" — classic memory pair-match. 12 cards (6 pairs of emoji
// symbols). Score = 30 - moves (clamped to 0). Win at moves <= 16.

import { useEffect, useMemo, useState } from 'react'
import { CoinIcon } from '@/components/ui/icons'
import { gameById } from '@/components/world/lobby-games-data'
import { LobbyResultScreen } from './LobbyResultScreen'
import { ru } from '@/i18n/ru'

const t = ru.lobbyGames

const SYMBOLS = ['🍎', '⭐', '🐶', '🌸', '⚽', '🚗']

interface Card {
  id: number
  symbol: string
  matched: boolean
  flipped: boolean
}

function buildDeck(): Card[] {
  const deck: Card[] = []
  let id = 1
  for (const s of SYMBOLS) {
    deck.push({ id: id++, symbol: s, matched: false, flipped: false })
    deck.push({ id: id++, symbol: s, matched: false, flipped: false })
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = deck[i]!
    deck[i] = deck[j]!
    deck[j] = tmp
  }
  return deck
}

interface PairsGameProps {
  opponentName?: string
}

export function PairsGame({ opponentName }: PairsGameProps) {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck())
  const [moves, setMoves] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'result'>('playing')
  const [busy, setBusy] = useState(false)

  const game = gameById('pairs')

  const flippedIdxs = useMemo(
    () =>
      deck
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.flipped && !c.matched)
        .map(({ i }) => i),
    [deck],
  )

  function handleCardClick(idx: number) {
    if (busy || phase !== 'playing') return
    const card = deck[idx]
    if (!card || card.flipped || card.matched) return

    setDeck((prev) => prev.map((c, i) => (i === idx ? { ...c, flipped: true } : c)))
  }

  // After a flip, if two cards are face-up resolve the pair.
  useEffect(() => {
    if (flippedIdxs.length !== 2) return
    setBusy(true)
    setMoves((m) => m + 1)

    const [a, b] = flippedIdxs
    const cardA = deck[a!]
    const cardB = deck[b!]
    if (!cardA || !cardB) {
      setBusy(false)
      return
    }

    if (cardA.symbol === cardB.symbol) {
      window.setTimeout(() => {
        setDeck((prev) =>
          prev.map((c, i) =>
            i === a || i === b ? { ...c, matched: true, flipped: true } : c,
          ),
        )
        setBusy(false)
      }, 240)
    } else {
      window.setTimeout(() => {
        setDeck((prev) =>
          prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)),
        )
        setBusy(false)
      }, 700)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedIdxs.length])

  // End game when all matched.
  useEffect(() => {
    if (phase !== 'playing') return
    if (deck.every((c) => c.matched)) {
      setPhase('result')
    }
  }, [deck, phase])

  function handlePlayAgain() {
    setDeck(buildDeck())
    setMoves(0)
    setBusy(false)
    setPhase('playing')
  }

  const won = moves <= game.winThreshold
  // Score is informational — final award uses won flag in finishLobbyGame.
  const score = Math.max(0, 30 - moves)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #FFF6E0 0%, #FFE6B0 100%)',
        fontFamily: 'Nunito, sans-serif',
        color: '#1F2937',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          zIndex: 5,
        }}
      >
        <Panel label={t.pairsMoves} value={moves} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <Panel
            label={t.hudScore}
            value={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CoinIcon size={18} /> {score}
              </span>
            }
          />
          {opponentName && <Panel label={t.hudOpponent} value={opponentName} small />}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '70px 16px 56px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            width: 'min(86vw, 420px)',
          }}
        >
          {deck.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={card.matched || busy}
              style={{
                aspectRatio: '3 / 4',
                borderRadius: 14,
                border: 'none',
                cursor: card.matched || card.flipped ? 'default' : 'pointer',
                background: card.flipped || card.matched ? '#FFFFFF' : '#1F2937',
                color: '#1F2937',
                fontSize: '2rem',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: card.matched
                  ? '0 0 0 3px #5BC675 inset, 0 4px 14px rgba(91,198,117,0.4)'
                  : '0 4px 14px rgba(31,41,55,0.18)',
                opacity: card.matched ? 0.85 : 1,
                transition: 'background 200ms ease, opacity 200ms ease',
              }}
              aria-label={card.flipped ? card.symbol : 'card'}
            >
              {card.flipped || card.matched ? card.symbol : ''}
            </button>
          ))}
        </div>
      </div>

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
        {t.pairsStartHint}
      </div>

      {phase === 'result' && (
        <LobbyResultScreen
          gameId="pairs"
          score={score}
          won={won}
          opponentName={opponentName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

function Panel({
  label,
  value,
  small,
}: {
  label: string
  value: React.ReactNode
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
      <div style={{ fontSize: small ? '0.85rem' : '1.05rem', fontWeight: 900 }}>{value}</div>
    </div>
  )
}
