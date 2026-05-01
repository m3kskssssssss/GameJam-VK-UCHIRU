'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    // Trigger slide-in animation on mount
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
    width: 'calc(100% - 32px)',
    maxWidth: 720,
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    padding: '18px 22px',
    boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
    opacity: visible ? 1 : 0,
    transition: 'opacity 200ms ease, transform 200ms ease',
    zIndex: 110,
  }

  const badgeStyle: React.CSSProperties = {
    color: '#4DA8DA',
    fontWeight: 800,
    fontSize: '0.85rem',
    fontFamily: 'Nunito, sans-serif',
    marginBottom: 0,
  }

  const textStyle: React.CSSProperties = {
    fontSize: '1.05rem',
    lineHeight: 1.45,
    color: '#1F2937',
    margin: '8px 0 14px',
    fontFamily: 'Nunito, sans-serif',
  }

  const getButtonStyle = (opt: DialogOption): React.CSSProperties => {
    const isLeave = opt.variant === 'leave'
    const isHovered = hoveredId === opt.id

    if (isLeave) {
      return {
        display: 'block',
        width: '100%',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1.5px solid #D1D5DB',
        background: isHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: '#6B7280',
        fontWeight: 700,
        fontSize: '1rem',
        fontFamily: 'Nunito, sans-serif',
        cursor: isBusy ? 'not-allowed' : 'pointer',
        opacity: isBusy ? 0.6 : 1,
        textAlign: 'left',
        transition: 'background 120ms ease',
        marginTop: 6,
      }
    }

    return {
      display: 'block',
      width: '100%',
      padding: '12px 16px',
      borderRadius: 12,
      border: 'none',
      background: isHovered ? '#E5EDF5' : '#F2F6FA',
      color: '#1F2937',
      fontWeight: 700,
      fontSize: '1rem',
      fontFamily: 'Nunito, sans-serif',
      cursor: isBusy ? 'not-allowed' : 'pointer',
      opacity: isBusy ? 0.6 : 1,
      textAlign: 'left',
      transition: 'background 120ms ease',
      marginTop: 6,
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
