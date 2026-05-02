'use client'
// QuestBook — book-icon button (top-right corner of the world HUD) that opens
// a fluid overlay listing the three quest tracks (initial / daily / main).
// Each step is a green tick when done, a hollow circle when pending. The
// main quest section locks until the initial quest is fully complete.

import { useCallback, useEffect, useState } from 'react'
import { getQuestState } from '@/server/actions/quests'
import type { QuestStateView, QuestView } from '@/server/actions/quests'

// ---------------------------------------------------------------------------
// Floating book button
// ---------------------------------------------------------------------------

interface QuestBookProps {
  /** Pixel offset from the right edge — distance is shared with other top-right
   *  HUD buttons (Lobby / Exit) so they stack cleanly. */
  rightPx?: number
  /** Pixel offset from the top edge. */
  topPx?: number
}

export function QuestBook({ rightPx = 16, topPx = 16 }: QuestBookProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<QuestStateView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const s = await getQuestState()
      setState(s)
    } catch {
      setError('Не удалось загрузить квесты')
    } finally {
      setLoading(false)
    }
  }, [])

  // Lazy-fetch on first open and on every subsequent open so the steps are
  // up-to-date after talking to grandparents / passing levels.
  useEffect(() => {
    if (!open) return
    void refresh()
  }, [open, refresh])

  // Quick "any quest in progress" indicator on the button — pulses red when
  // there's at least one unfinished quest the player can act on.
  const hasPending =
    state !== null &&
    (!state.initial.completed ||
      !state.daily.completed ||
      (!state.main.locked && !state.main.completed))

  return (
    <>
      <button
        type="button"
        aria-label="Книга квестов"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          top: topPx,
          right: rightPx,
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.85)',
          border: '1.5px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
          color: '#1F2937',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 25,
          pointerEvents: 'auto',
        }}
      >
        <BookIcon />
        {hasPending && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#FF6B6B',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.85)',
            }}
          />
        )}
      </button>

      {open && (
        <QuestBookOverlay
          state={state}
          loading={loading}
          error={error}
          onClose={() => setOpen(false)}
          onRetry={refresh}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

interface OverlayProps {
  state: QuestStateView | null
  loading: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
}

function QuestBookOverlay({ state, loading, error, onClose, onRetry }: OverlayProps) {
  return (
    <div
      role="dialog"
      aria-label="Книга квестов"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.70)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top), 16px) max(env(safe-area-inset-right), 16px) max(env(safe-area-inset-bottom), 16px) max(env(safe-area-inset-left), 16px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          background: '#FFF9F0',
          borderRadius: 'clamp(14px, 2vh, 22px)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          padding: 'clamp(16px, 2.4vh, 24px)',
          fontFamily: 'Nunito, sans-serif',
          color: '#1F2937',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#6B7280',
            fontSize: 22,
            fontWeight: 800,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2
          style={{
            fontSize: 'clamp(1.05rem, 2.4vh, 1.35rem)',
            fontWeight: 800,
            margin: '0 0 4px',
          }}
        >
          Книга квестов
        </h2>
        <p
          style={{
            margin: '0 0 14px',
            color: '#6B7280',
            fontSize: 'clamp(0.78rem, 1.8vh, 0.9rem)',
          }}
        >
          Выполняй задания и получай награды.
        </p>

        {loading && !state && (
          <p style={{ color: '#6B7280', fontSize: '0.9rem', padding: '12px 0' }}>
            Загрузка...
          </p>
        )}

        {error && (
          <div style={{ padding: '12px 0' }}>
            <p style={{ color: '#FF6B6B', fontSize: '0.9rem', marginBottom: 8 }}>
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              style={{
                background: '#4DA8DA',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Повторить
            </button>
          </div>
        )}

        {state && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <QuestSection quest={state.initial} accent="#4DA8DA" />
            <QuestSection quest={state.daily} accent="#6BCB77" />
            <QuestSection quest={state.main} accent="#FFB347" />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

interface QuestSectionProps {
  quest: QuestView
  accent: string
}

function QuestSection({ quest, accent }: QuestSectionProps) {
  const total = quest.steps.length
  const done = quest.steps.filter((s) => s.done).length
  const ratio = total === 0 ? 0 : done / total

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 'clamp(10px, 1.6vh, 14px)',
        border: '1px solid #E5DFD2',
        opacity: quest.locked ? 0.62 : 1,
        position: 'relative',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 'clamp(0.92rem, 2.1vh, 1.05rem)',
              fontWeight: 800,
            }}
          >
            {quest.locked ? '🔒 ' : ''}
            {quest.title}
          </h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 'clamp(0.72rem, 1.6vh, 0.82rem)',
              color: '#6B7280',
            }}
          >
            {quest.subtitle}
          </p>
        </div>
        <div
          style={{
            flexShrink: 0,
            background: quest.completed ? '#6BCB77' : accent,
            color: '#fff',
            fontWeight: 800,
            fontSize: 'clamp(0.7rem, 1.6vh, 0.8rem)',
            borderRadius: 999,
            padding: '3px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          {done}/{total}
        </div>
      </header>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: '#F1ECE2',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            background: quest.completed ? '#6BCB77' : accent,
            transition: 'width 220ms ease',
          }}
        />
      </div>

      {/* Steps */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {quest.steps.map((step) => (
          <li
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'clamp(0.82rem, 1.85vh, 0.94rem)',
              color: step.done ? '#9CA3AF' : '#1F2937',
              textDecoration: step.done ? 'line-through' : 'none',
            }}
          >
            <StepCheck done={step.done} />
            <span style={{ flex: 1, minWidth: 0 }}>{step.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Tiny visuals
// ---------------------------------------------------------------------------

function StepCheck({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#6BCB77',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        ✓
      </span>
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid #D1D5DB',
        boxSizing: 'border-box',
      }}
    />
  )
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5C5 3.67 5.67 3 6.5 3H18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5C5.67 19 5 18.33 5 17.5v-13Z"
        stroke="#1F2937"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 17.5C5 16.67 5.67 16 6.5 16H19v3.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-2Z"
        stroke="#1F2937"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 7h7M8 10h7" stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
