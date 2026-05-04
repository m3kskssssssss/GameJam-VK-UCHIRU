'use client'
// "Память" — Simon-says style. The game flashes a sequence of 4 colour pads,
// growing by one pad each round. Repeat the sequence to advance. Score is
// the number of completed rounds; 5+ counts as a win.

import { useEffect, useRef, useState } from 'react'
import { CoinIcon } from '@/components/ui/icons'
import { gameById } from '@/components/world/lobby-games-data'
import { LobbyResultScreen } from './LobbyResultScreen'
import { ru } from '@/i18n/ru'

const t = ru.lobbyGames

const PADS = [
  { key: 'red', color: '#E76F6F' },
  { key: 'yellow', color: '#FFD86E' },
  { key: 'green', color: '#5BC675' },
  { key: 'blue', color: '#4DA8DA' },
] as const

type PadKey = (typeof PADS)[number]['key']

const FLASH_MS = 520
const GAP_MS = 220

interface MemoryGameProps {
  opponentName?: string
}

export function MemoryGame({ opponentName }: MemoryGameProps) {
  const [phase, setPhase] = useState<'idle' | 'show' | 'input' | 'result'>('idle')
  const [sequence, setSequence] = useState<PadKey[]>([])
  const [activePad, setActivePad] = useState<PadKey | null>(null)
  const [inputIndex, setInputIndex] = useState(0)
  const [round, setRound] = useState(0)
  const wonRef = useRef(false)

  const game = gameById('memory')

  function startNextRound() {
    setSequence((prev) => {
      const next = [...prev, randomPad()]
      // schedule playback in an effect by toggling phase
      setRound(next.length)
      setPhase('show')
      setInputIndex(0)
      return next
    })
  }

  // Initial round on mount.
  useEffect(() => {
    if (phase === 'idle') {
      startNextRound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Playback the sequence when phase=show.
  useEffect(() => {
    if (phase !== 'show') return
    let cancelled = false
    let i = 0
    function playNext() {
      if (cancelled) return
      if (i >= sequence.length) {
        setActivePad(null)
        setPhase('input')
        return
      }
      setActivePad(sequence[i] ?? null)
      window.setTimeout(() => {
        if (cancelled) return
        setActivePad(null)
        i++
        window.setTimeout(playNext, GAP_MS)
      }, FLASH_MS)
    }
    // small delay before starting the playback so the player notices the round bump.
    const id = window.setTimeout(playNext, 380)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [phase, sequence])

  function handlePadTap(key: PadKey) {
    if (phase !== 'input') return
    const expected = sequence[inputIndex]
    if (key !== expected) {
      // mistake → end round
      wonRef.current = round - 1 >= game.winThreshold
      setPhase('result')
      return
    }
    setActivePad(key)
    window.setTimeout(() => setActivePad(null), 180)
    const nextIndex = inputIndex + 1
    if (nextIndex >= sequence.length) {
      // round complete — if we hit the threshold, end with a win
      if (round >= game.winThreshold) {
        wonRef.current = true
        setPhase('result')
        return
      }
      window.setTimeout(() => startNextRound(), 380)
    } else {
      setInputIndex(nextIndex)
    }
  }

  function handlePlayAgain() {
    wonRef.current = false
    setSequence([])
    setRound(0)
    setInputIndex(0)
    setActivePad(null)
    setPhase('idle')
  }

  // Score = the number of rounds completed (round - 1 if we failed,
  // round if we hit the threshold).
  const completedRounds = phase === 'result'
    ? wonRef.current
      ? round
      : Math.max(0, round - 1)
    : Math.max(0, round - 1)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #DDF1FF 0%, #B9DBF8 100%)',
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
        <Panel label={t.hudRound} value={round} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <Panel
            label={t.hudScore}
            value={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CoinIcon size={18} /> {completedRounds}
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 16px',
        }}
      >
        <div
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            background: 'rgba(255,255,255,0.8)',
            padding: '6px 14px',
            borderRadius: 12,
          }}
        >
          {phase === 'show' ? t.memoryWatch : phase === 'input' ? t.memoryYourTurn : '…'}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            width: 'min(80vw, 320px)',
            aspectRatio: '1 / 1',
          }}
        >
          {PADS.map((pad) => {
            const active = activePad === pad.key
            return (
              <button
                key={pad.key}
                disabled={phase !== 'input'}
                onClick={() => handlePadTap(pad.key)}
                style={{
                  background: pad.color,
                  border: 'none',
                  borderRadius: 18,
                  cursor: phase === 'input' ? 'pointer' : 'default',
                  opacity: active ? 1 : 0.78,
                  transform: active ? 'scale(0.97)' : 'scale(1)',
                  transition: 'opacity 120ms ease, transform 120ms ease',
                  boxShadow: active
                    ? `0 0 32px ${pad.color}, 0 0 12px #fff inset`
                    : '0 6px 16px rgba(31,41,55,0.18)',
                }}
                aria-label={pad.key}
              />
            )
          })}
        </div>

        <div
          style={{
            color: '#4B5563',
            fontSize: '0.85rem',
            fontWeight: 700,
            textAlign: 'center',
            maxWidth: 340,
          }}
        >
          {t.memoryStartHint}
        </div>
      </div>

      {phase === 'result' && (
        <LobbyResultScreen
          gameId="memory"
          score={completedRounds}
          won={wonRef.current}
          opponentName={opponentName}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

function randomPad(): PadKey {
  const idx = Math.floor(Math.random() * PADS.length)
  return PADS[idx]!.key
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
