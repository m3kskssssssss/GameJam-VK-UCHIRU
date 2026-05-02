'use client'

import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

export interface DialogOption {
  id: string
  label: string
  onPick: () => void
  variant?: 'default' | 'leave'
}

interface Props {
  text: string
  speakerLabel: string
  options: DialogOption[]
  isBusy?: boolean
}

export function DialogBox({ text, speakerLabel, options, isBusy = false }: Props) {
  const [visible, setVisible] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    // Trigger slide-in animation on mount
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: isMobile ? 6 : 24,
    left: '50%',
    transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
    // On mobile keep the box well clear of the portrait slots on either side
    // (each portrait slot is ~26vw / 95px). Width tracks the central gap so
    // it can never grow into the portraits.
    width: isMobile ? 'min(180px, calc(100vw - 220px))' : 'calc(100% - 24px)',
    maxWidth: isMobile ? 180 : 720,
    maxHeight: isMobile ? '60vh' : 'none',
    overflowY: isMobile ? 'auto' : 'visible',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: isMobile ? 10 : 20,
    padding: isMobile ? '6px 8px' : '18px 22px',
    boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
    opacity: visible ? 1 : 0,
    transition: 'opacity 200ms ease, transform 200ms ease',
    zIndex: 110,
  }

  const badgeStyle: React.CSSProperties = {
    color: '#4DA8DA',
    fontWeight: 800,
    fontSize: isMobile ? '0.6rem' : '0.85rem',
    fontFamily: 'Nunito, sans-serif',
    marginBottom: 0,
  }

  const textStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.7rem' : '1.05rem',
    lineHeight: 1.3,
    color: '#1F2937',
    margin: isMobile ? '2px 0 4px' : '8px 0 14px',
    fontFamily: 'Nunito, sans-serif',
  }

  const getButtonStyle = (opt: DialogOption): React.CSSProperties => {
    const isLeave = opt.variant === 'leave'
    const isHovered = hoveredId === opt.id

    const base: React.CSSProperties = {
      display: 'block',
      width: '100%',
      padding: isMobile ? '4px 6px' : '12px 16px',
      borderRadius: isMobile ? 6 : 12,
      fontWeight: isLeave ? 700 : 700,
      fontSize: isMobile ? '0.7rem' : '1rem',
      lineHeight: 1.2,
      fontFamily: 'Nunito, sans-serif',
      cursor: isBusy ? 'not-allowed' : 'pointer',
      opacity: isBusy ? 0.6 : 1,
      textAlign: 'left',
      transition: 'background 120ms ease',
      marginTop: isMobile ? 2 : 6,
    }

    if (isLeave) {
      return {
        ...base,
        border: '1.5px solid #D1D5DB',
        background: isHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: '#6B7280',
      }
    }

    return {
      ...base,
      border: 'none',
      background: isHovered ? '#E5EDF5' : '#F2F6FA',
      color: '#1F2937',
    }
  }

  return (
    <div style={boxStyle} role="dialog" aria-label={speakerLabel}>
      <p style={badgeStyle}>{speakerLabel}</p>
      <p style={textStyle}>{text}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            style={getButtonStyle(opt)}
            disabled={isBusy}
            onClick={isBusy ? undefined : opt.onPick}
            onMouseEnter={() => setHoveredId(opt.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(opt.id)}
            onBlur={() => setHoveredId(null)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
