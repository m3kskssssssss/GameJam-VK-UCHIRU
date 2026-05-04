'use client'
// Phase 6 (Task 6.8) — Tab switcher between rooms.
// Room 0 is always unlocked. Room 1 requires homeLevel >= 2 AND 200 coins.
// If room 1 is locked the tab shows a CTA to unlock it instead.

import { ru } from '@/i18n/ru'
import { CoinIcon } from '@/components/ui/icons'
import type { RoomSummary } from '@/server/actions/rooms'

const t = ru.home

// ---- Constants --------------------------------------------------------------

const ROOM_COUNT = 2
const ROOM_UNLOCK_COST = 200
const ROOM_UNLOCK_MIN_LEVEL = 2

// ---- Props ------------------------------------------------------------------

export interface RoomTabsProps {
  rooms: RoomSummary[]
  activeRoomIndex: number
  homeLevel: number
  coins: number
  /** Signals "unlock in progress" so the button is disabled. */
  unlocking: boolean
  onSelectRoom: (index: number) => void
  onUnlockRoom: (index: number) => void
}

// ---- Component --------------------------------------------------------------

export function RoomTabs({
  rooms,
  activeRoomIndex,
  homeLevel,
  coins,
  unlocking,
  onSelectRoom,
  onUnlockRoom,
}: RoomTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {Array.from({ length: ROOM_COUNT }, (_, idx) => {
        const room = rooms.find((r) => r.index === idx)
        const isUnlocked = room?.unlocked ?? false
        const isActive = activeRoomIndex === idx && isUnlocked

        // Room 0 is always accessible.
        if (idx === 0) {
          return (
            <button
              key={idx}
              onClick={() => onSelectRoom(0)}
              aria-current={isActive ? 'true' : undefined}
              style={tabStyle(isActive, false)}
            >
              {t.roomLabel} 1
            </button>
          )
        }

        // Room 1: unlocked — show normal tab.
        if (isUnlocked) {
          return (
            <button
              key={idx}
              onClick={() => onSelectRoom(idx)}
              aria-current={isActive ? 'true' : undefined}
              style={tabStyle(isActive, false)}
            >
              {t.roomLabel} {idx + 1}
            </button>
          )
        }

        // Room 1: locked — show unlock CTA if requirements met.
        const canUnlock =
          homeLevel >= ROOM_UNLOCK_MIN_LEVEL && coins >= ROOM_UNLOCK_COST

        return (
          <button
            key={idx}
            onClick={() => {
              if (canUnlock && !unlocking) onUnlockRoom(idx)
            }}
            disabled={!canUnlock || unlocking}
            title={
              !canUnlock
                ? t.unlockRoomCost
                : unlocking
                ? 'Открываем...'
                : t.unlockRoomBtn
            }
            aria-label={`${t.unlockRoomTitle} — ${t.unlockRoomCost}`}
            style={tabStyle(false, true, !canUnlock || unlocking)}
          >
            {t.unlockRoomTitle}
            {' '}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.7rem',
                opacity: 0.75,
                marginLeft: '0.25rem',
              }}
            >
              (200 <CoinIcon size={11} />)
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ---- Style helpers ----------------------------------------------------------

function tabStyle(
  isActive: boolean,
  isUnlockCta: boolean,
  disabled = false,
): React.CSSProperties {
  if (isUnlockCta) {
    return {
      padding: '0.35rem 0.9rem',
      borderRadius: '0.65rem',
      border: '1.5px dashed rgba(77,168,218,0.6)',
      background: disabled
        ? 'rgba(240,240,240,0.7)'
        : 'rgba(77,168,218,0.08)',
      color: disabled ? '#bbb' : '#4DA8DA',
      fontSize: '0.82rem',
      fontWeight: 700,
      fontFamily: 'Nunito, sans-serif',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      transition: 'background 0.15s',
    }
  }

  return {
    padding: '0.35rem 0.9rem',
    borderRadius: '0.65rem',
    border: isActive
      ? '2px solid #4DA8DA'
      : '1.5px solid rgba(229,223,210,0.8)',
    background: isActive ? '#4DA8DA' : 'rgba(255,255,255,0.85)',
    color: isActive ? '#fff' : '#1F2937',
    fontSize: '0.82rem',
    fontWeight: 700,
    fontFamily: 'Nunito, sans-serif',
    cursor: 'pointer',
    transition: 'background 0.15s, border 0.15s',
  }
}
