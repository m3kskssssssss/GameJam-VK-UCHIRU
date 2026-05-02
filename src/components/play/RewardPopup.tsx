'use client'
// Celebratory overlay shown over the 3D world after a grandparent task is
// completed. Reads the pendingReward slot from the game store, displays
// "Молодец!" + reward chips, and clears the slot when dismissed (or after
// auto-timeout).

import { useEffect } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const AUTO_DISMISS_MS = 5_000

export function RewardPopup() {
  const reward = useGameStore((s) => s.pendingReward)
  const setPendingReward = useGameStore((s) => s.setPendingReward)

  useEffect(() => {
    if (!reward) return
    const id = window.setTimeout(() => setPendingReward(null), AUTO_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [reward, setPendingReward])

  if (!reward) return null

  const showRewards = reward.coinsEarned > 0 || reward.energyEarned > 0

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Задание выполнено"
      onClick={() => setPendingReward(null)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'max(env(safe-area-inset-top), 16px) max(env(safe-area-inset-right), 16px) max(env(safe-area-inset-bottom), 16px) max(env(safe-area-inset-left), 16px)',
        zIndex: 250,
        animation: 'kq-reward-fade 200ms ease-out',
        pointerEvents: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)',
          background: '#FFF9F0',
          borderRadius: 'clamp(14px, 2vh, 22px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          padding: 'clamp(18px, 3vh, 28px)',
          textAlign: 'center',
          fontFamily: 'Nunito, sans-serif',
          color: '#1F2937',
          animation: 'kq-reward-pop 320ms cubic-bezier(.2,1,.3,1)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#6BCB77',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            color: '#fff',
            fontWeight: 800,
            boxShadow: '0 6px 16px rgba(107,203,119,0.45)',
          }}
        >
          ✓
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.2rem, 2.8vh, 1.6rem)',
            fontWeight: 800,
            margin: '0 0 6px',
          }}
        >
          Молодец!
        </h2>
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 'clamp(0.9rem, 2.1vh, 1.05rem)',
            fontWeight: 700,
            color: '#1F2937',
          }}
        >
          Задание выполнено
        </p>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 'clamp(0.78rem, 1.8vh, 0.9rem)',
            color: '#6B7280',
          }}
        >
          {reward.title}
        </p>

        {showRewards ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            {reward.coinsEarned > 0 && (
              <RewardPill colour="#FFB347">
                <span aria-hidden="true">🪙</span>+{reward.coinsEarned}
              </RewardPill>
            )}
            {reward.energyEarned > 0 && (
              <RewardPill colour="#6BCB77">
                <span aria-hidden="true">⚡</span>+{reward.energyEarned}
              </RewardPill>
            )}
          </div>
        ) : (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#6B7280',
              fontStyle: 'italic',
              marginBottom: 18,
            }}
          >
            Награду за это задание ты уже получал.
          </p>
        )}

        <button
          type="button"
          onClick={() => setPendingReward(null)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#4DA8DA',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1rem',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(77,168,218,0.35)',
          }}
        >
          Здорово!
        </button>
      </div>

      <style>{`
        @keyframes kq-reward-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes kq-reward-pop {
          from { transform: translateY(8px) scale(0.92); opacity: 0 }
          to   { transform: translateY(0)   scale(1);    opacity: 1 }
        }
      `}</style>
    </div>
  )
}

function RewardPill({ colour, children }: { colour: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 999,
        background: colour,
        color: '#fff',
        fontWeight: 800,
        fontSize: 'clamp(0.85rem, 2vh, 1rem)',
      }}
    >
      {children}
    </span>
  )
}
