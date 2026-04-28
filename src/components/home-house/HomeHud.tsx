'use client'
// Phase 6 — Top bar HUD for the home interior screen.
// Matches pill style from src/components/play/Hud.tsx.

import { Shirt, ShoppingBag, Hammer, Check, ArrowLeft, Users } from 'lucide-react'
import { ru } from '@/i18n/ru'

const t = ru.home

// ---- Icon helpers (inline SVG, same approach as play/Hud) --------------------

function CoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#FFB347" stroke="#FB8C00" strokeWidth="1.5" />
      <text x="10" y="14" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="Nunito, sans-serif">
        ₽
      </text>
    </svg>
  )
}

function EnergyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#6BCB77" stroke="#43A047" strokeWidth="1.5" />
      <text x="10" y="14" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="Nunito, sans-serif">
        ⚡
      </text>
    </svg>
  )
}

// ---- Props ------------------------------------------------------------------

export interface HomeHudProps {
  coins: number
  energy: number
  homeLevel: number
  placementMode: boolean
  onOpenWardrobe: () => void
  onOpenShop: () => void
  onTogglePlacement: () => void
  onExit: () => void
  onLobby: () => void
}

// ---- Component --------------------------------------------------------------

export function HomeHud({
  coins,
  energy,
  homeLevel,
  placementMode,
  onOpenWardrobe,
  onOpenShop,
  onTogglePlacement,
  onExit,
  onLobby,
}: HomeHudProps) {
  return (
    <div style={hudWrapperStyle}>
      {/* ── Top bar ── */}
      <div style={topBarStyle}>
        {/* Left: currency + level pills */}
        <div style={pillGroupStyle}>
          <div style={pillStyle}>
            <CoinIcon />
            <span style={pillTextStyle}>{coins}</span>
          </div>
          <div style={pillStyle}>
            <EnergyIcon />
            <span style={pillTextStyle}>{energy}</span>
          </div>
          <div style={{ ...pillStyle, background: 'rgba(77,168,218,0.85)' }}>
            <span style={{ ...pillTextStyle, color: '#fff' }}>
              {ru.play.hud.homeLevelLabel} {homeLevel}
            </span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div style={actionGroupStyle}>
          <button
            style={iconBtnStyle}
            onClick={onOpenWardrobe}
            title={t.btnWardrobe}
            aria-label={t.btnWardrobe}
          >
            <Shirt size={18} />
          </button>

          <button
            style={iconBtnStyle}
            onClick={onOpenShop}
            title={t.btnShop}
            aria-label={t.btnShop}
          >
            <ShoppingBag size={18} />
          </button>

          <button
            style={{
              ...iconBtnStyle,
              background: placementMode
                ? 'rgba(77,168,218,0.9)'
                : 'rgba(255,255,255,0.85)',
              color: placementMode ? '#fff' : '#1F2937',
            }}
            onClick={onTogglePlacement}
            title={placementMode ? t.btnFinishEdit : t.btnEditRoom}
            aria-label={placementMode ? t.btnFinishEdit : t.btnEditRoom}
          >
            {placementMode ? <Check size={18} /> : <Hammer size={18} />}
          </button>
        </div>
      </div>

      {/* ── Bottom navigation bar ── */}
      <div style={bottomBarStyle}>
        <button style={navBtnStyle} onClick={onExit}>
          <ArrowLeft size={16} />
          <span>{t.btnBack}</span>
        </button>

        <button style={navBtnStyle} onClick={onLobby}>
          <Users size={16} />
          <span>{t.btnLobby}</span>
        </button>
      </div>
    </div>
  )
}

// ---- Styles -----------------------------------------------------------------

const hudWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  width: '100%',
}

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 1rem',
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(6px)',
  borderBottom: '1px solid rgba(229,223,210,0.6)',
}

const pillGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  flexWrap: 'wrap',
}

const pillStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.25rem 0.6rem',
  background: 'rgba(255,255,255,0.85)',
  borderRadius: 9999,
  boxShadow: '0 2px 6px rgba(31,41,55,0.12)',
}

const pillTextStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#1F2937',
  fontFamily: 'Nunito, sans-serif',
}

const actionGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
}

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  background: 'rgba(255,255,255,0.85)',
  border: '1.5px solid rgba(229,223,210,0.8)',
  borderRadius: '0.65rem',
  color: '#1F2937',
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(31,41,55,0.08)',
  transition: 'background 0.15s',
}

const bottomBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '0.5rem 1rem',
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(4px)',
  borderTop: '1px solid rgba(229,223,210,0.5)',
}

const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.45rem 1.1rem',
  background: 'rgba(255,255,255,0.85)',
  border: '1.5px solid rgba(229,223,210,0.8)',
  borderRadius: '0.75rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#1F2937',
  fontFamily: 'Nunito, sans-serif',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(31,41,55,0.1)',
}
