'use client'
// HUD DOM overlay for the play world.
// Renders on top of the R3F canvas; never inside the Canvas.

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOutAction } from '@/server/actions/auth-actions'
import { useGameStore } from '@/hooks/useGameStore'
import type { HouseSubject } from '@/hooks/useGameStore'
import { ru } from '@/i18n/ru'

const { play: t } = ru

// TODO (Phase 5/6): After mini-game completion, call router.refresh() on return
// to re-seed coins/energy from the server. No polling needed.

function getHouseRoute(subject: HouseSubject): string {
  if (subject === 'home') return '/play/home'
  return `/play/house/${subject}`
}

function CoinIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" fill="#FFB347" stroke="#FB8C00" strokeWidth="1.5" />
      <text
        x="10"
        y="14"
        textAnchor="middle"
        fill="#fff"
        fontSize="10"
        fontWeight="bold"
        fontFamily="Nunito, sans-serif"
      >
        ₽
      </text>
    </svg>
  )
}

function EnergyIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" fill="#6BCB77" stroke="#43A047" strokeWidth="1.5" />
      <text
        x="10"
        y="14"
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontWeight="bold"
        fontFamily="Nunito, sans-serif"
      >
        ⚡
      </text>
    </svg>
  )
}

export function Hud() {
  const coins = useGameStore((s) => s.coins)
  const energy = useGameStore((s) => s.energy)
  const homeLevel = useGameStore((s) => s.homeLevel)
  const nearHouse = useGameStore((s) => s.nearHouse)

  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleEnter() {
    if (!nearHouse) return
    startTransition(() => {
      router.push(getHouseRoute(nearHouse))
    })
  }

  function handleLogout() {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Top-left: currency pills */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {/* Coins */}
        <div style={pillStyle}>
          <CoinIcon />
          <span style={pillTextStyle}>{coins}</span>
        </div>

        {/* Energy */}
        <div style={pillStyle}>
          <EnergyIcon />
          <span style={pillTextStyle}>{energy}</span>
        </div>

        {/* Home level badge */}
        <div style={{ ...pillStyle, background: 'rgba(77,168,218,0.85)' }}>
          <span style={pillTextStyle}>{t.hud.homeLevelLabel} {homeLevel}</span>
        </div>
      </div>

      {/* Top-right: lobby + logout */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'flex-end',
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={() => router.push('/play/lobby')}
          disabled={isPending}
          style={lobbyBtnStyle}
        >
          {ru.home.btnLobby}
        </button>
        <button
          onClick={handleLogout}
          disabled={isPending}
          style={exitBtnStyle}
        >
          {t.hud.btnExit}
        </button>
      </div>

      {/* Bottom-centre: "Enter house" CTA */}
      {nearHouse && (
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={handleEnter}
            disabled={isPending}
            style={enterBtnStyle}
          >
            {t.hud.btnEnter}
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Inline styles (avoids Tailwind class purge issues inside canvas overlays) ----

const pillStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.3rem 0.75rem',
  background: 'rgba(255,255,255,0.85)',
  borderRadius: '9999px',
  boxShadow: '0 2px 8px rgba(31,41,55,0.15)',
  backdropFilter: 'blur(4px)',
}

const pillTextStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#1F2937',
  fontFamily: 'Nunito, sans-serif',
}

const exitBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  background: 'rgba(255,255,255,0.85)',
  border: '1.5px solid rgba(229,223,210,0.8)',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#1F2937',
  fontFamily: 'Nunito, sans-serif',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 2px 8px rgba(31,41,55,0.1)',
}

const lobbyBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  background: 'rgba(77,168,218,0.85)',
  border: '1.5px solid rgba(77,168,218,0.6)',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: 700,
  color: '#ffffff',
  fontFamily: 'Nunito, sans-serif',
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 2px 8px rgba(77,168,218,0.3)',
  whiteSpace: 'nowrap',
}

const enterBtnStyle: React.CSSProperties = {
  padding: '1rem 2.5rem',
  background: '#4DA8DA',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '1.1rem',
  fontWeight: 800,
  color: '#ffffff',
  fontFamily: 'Nunito, sans-serif',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(77,168,218,0.5)',
  letterSpacing: '0.01em',
}
