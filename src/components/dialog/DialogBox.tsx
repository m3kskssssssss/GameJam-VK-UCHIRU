'use client'

import { useEffect, useState } from 'react'

export type DialogOptionVariant = 'default' | 'leave' | 'task'

export interface DialogOption {
  id: string
  label: string
  onPick: () => void
  variant?: DialogOptionVariant
  completed?: boolean
}

interface Props {
  text: string
  speakerLabel: string
  options: DialogOption[]
  isBusy?: boolean
}

// One unified, fluid sizing system. Every dimension is a clamp() expressed in
// vw / vh / dvh so the layout looks identical (in proportion) on iPhone 12,
// iPhone 15 Pro, an old Android, and a desktop browser. No isMobile branching.
export function DialogBox({ text, speakerLabel, options, isBusy = false }: Props) {
  const [visible, setVisible] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Layout split: task options as a 2-col grid, chat/leave options as
  // a single column underneath. Order is preserved within each group.
  const taskOptions = options.filter((o) => o.variant === 'task')
  const otherOptions = options.filter((o) => o.variant !== 'task')

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    // Sit just above the bottom safe area so the dialog never tucks under
    // a home indicator on iOS.
    bottom: 'max(env(safe-area-inset-bottom), 12px)',
    left: '50%',
    transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
    // Fluid width — narrows on phones (where portraits flank it) and grows
    // up to 720px on desktop.
    width: 'min(calc(100vw - clamp(220px, 46vw, 760px)), 720px)',
    minWidth: 'min(280px, 80vw)',
    maxWidth: 'min(720px, 92vw)',
    // Cap at ~70% of the viewport so it never reaches the portrait heads.
    maxHeight: '70dvh',
    overflowY: 'auto',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 'clamp(10px, 1.6vh, 18px)',
    padding: 'clamp(8px, 1.6vh, 18px) clamp(12px, 2vw, 22px)',
    boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
    opacity: visible ? 1 : 0,
    transition: 'opacity 200ms ease, transform 200ms ease',
    zIndex: 110,
  }

  const badgeStyle: React.CSSProperties = {
    color: '#4DA8DA',
    fontWeight: 800,
    fontSize: 'clamp(0.72rem, 1.7vh, 0.95rem)',
    fontFamily: 'Nunito, sans-serif',
    margin: 0,
  }

  const textStyle: React.CSSProperties = {
    fontSize: 'clamp(0.85rem, 2.1vh, 1.05rem)',
    lineHeight: 1.35,
    color: '#1F2937',
    margin: 'clamp(2px, 0.6vh, 8px) 0 clamp(6px, 1.2vh, 14px)',
    fontFamily: 'Nunito, sans-serif',
  }

  const getButtonStyle = (opt: DialogOption): React.CSSProperties => {
    const isLeave = opt.variant === 'leave'
    const isTask = opt.variant === 'task'
    const isCompleted = isTask && Boolean(opt.completed)
    const isHovered = hoveredId === opt.id

    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      width: '100%',
      padding: 'clamp(6px, 1.2vh, 12px) clamp(8px, 1.4vw, 16px)',
      borderRadius: 'clamp(8px, 1.4vh, 12px)',
      fontWeight: 700,
      fontSize: 'clamp(0.78rem, 1.9vh, 1rem)',
      lineHeight: 1.2,
      fontFamily: 'Nunito, sans-serif',
      cursor: isBusy ? 'not-allowed' : 'pointer',
      opacity: isBusy ? 0.6 : 1,
      textAlign: 'left',
      transition: 'background 120ms ease',
    }

    if (isLeave) {
      return {
        ...base,
        border: '1.5px solid #D1D5DB',
        background: isHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: '#6B7280',
      }
    }

    if (isCompleted) {
      // Same visual language as the "leave" button — gray border, gray text.
      return {
        ...base,
        border: '1.5px solid #D1D5DB',
        background: isHovered ? 'rgba(0,0,0,0.03)' : 'transparent',
        color: '#9CA3AF',
      }
    }

    return {
      ...base,
      border: 'none',
      background: isHovered ? '#E5EDF5' : '#F2F6FA',
      color: '#1F2937',
    }
  }

  const taskGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(4px, 0.8vh, 8px)',
    marginBottom: otherOptions.length > 0 ? 'clamp(4px, 0.8vh, 8px)' : 0,
  }

  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(3px, 0.7vh, 6px)',
  }

  return (
    <div style={boxStyle} role="dialog" aria-label={speakerLabel}>
      <p style={badgeStyle}>{speakerLabel}</p>
      <p style={textStyle}>{text}</p>

      {taskOptions.length > 0 && (
        <div style={taskGridStyle}>
          {taskOptions.map((opt) => (
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
              {opt.completed && (
                <span
                  aria-hidden="true"
                  style={{
                    color: '#9CA3AF',
                    fontWeight: 800,
                    fontSize: '1.05em',
                    lineHeight: 1,
                  }}
                >
                  ✓
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {otherOptions.length > 0 && (
        <div style={stackStyle}>
          {otherOptions.map((opt) => (
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
              <span style={{ flex: 1, minWidth: 0 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
