'use client'
// Phase 6 — 8×6 CSS grid for room furniture placement.
// Placeholder rendering only; real sprites deferred to Phase 8.

import type { RoomSummary, InventoryItemSummary } from '@/server/actions/rooms'
import { ru } from '@/i18n/ru'
import { PlacedItem } from './PlacedItem'
import { PetSprite } from './PetSprite'

const t = ru.home

const COLS = 8
const ROWS = 6

export interface RoomGridProps {
  room: RoomSummary | undefined
  inventory: InventoryItemSummary[]
  placementMode: boolean
  selectedItemId: string | null
  petKey: string | null
  onCellTap: (x: number, y: number) => void
  onPlacedItemTap: (itemId: string) => void
}

export function RoomGrid({
  room,
  inventory: _inventory,
  placementMode,
  selectedItemId,
  petKey,
  onCellTap,
  onPlacedItemTap,
}: RoomGridProps) {
  // Build a lookup: "x,y" → placement
  const placementMap = new Map(
    (room?.placements ?? []).map((p) => [`${p.x},${p.y}`, p]),
  )

  const isCellTappable = placementMode && selectedItemId !== null

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Empty-state hint when no items placed and not in edit mode */}
      {!room?.placements.length && !placementMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              color: 'rgba(100,100,100,0.7)',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {t.noPlacedItems}
          </span>
        </div>
      )}

      {/* Placement mode hint — shown when an item is selected */}
      {placementMode && selectedItemId && (
        <div
          style={{
            position: 'absolute',
            bottom: -28,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'rgba(60,60,60,0.8)',
            fontFamily: 'Nunito, sans-serif',
            pointerEvents: 'none',
          }}
        >
          {t.placementHint}
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--color-muted, #e9e4d8)',
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid rgba(0,0,0,0.08)',
        }}
      >
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const key = `${col},${row}`
            const placement = placementMap.get(key)
            const isPlaced = !!placement
            const isHighlighted = isCellTappable && !isPlaced

            return (
              <div
                key={key}
                role={isCellTappable && !isPlaced ? 'button' : undefined}
                tabIndex={isCellTappable && !isPlaced ? 0 : undefined}
                aria-label={
                  isCellTappable && !isPlaced
                    ? `Поставить сюда (${col},${row})`
                    : undefined
                }
                onClick={() => {
                  if (!isPlaced && isCellTappable) {
                    onCellTap(col, row)
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isPlaced && isCellTappable) {
                    e.preventDefault()
                    onCellTap(col, row)
                  }
                }}
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                  backgroundColor: isHighlighted
                    ? 'rgba(77,168,218,0.15)'
                    : 'transparent',
                  cursor: isCellTappable && !isPlaced ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                  transition: 'background-color 0.1s',
                  userSelect: 'none',
                }}
              >
                {isPlaced && placement ? (
                  <PlacedItem
                    itemId={placement.itemId}
                    catalogKey={placement.catalogKey}
                    inEditMode={placementMode}
                    onTap={onPlacedItemTap}
                  />
                ) : null}
              </div>
            )
          }),
        )}
      </div>

      {/* Pet sprite — bottom-right, above the grid overlay */}
      {petKey && <PetSprite petKey={petKey} />}
    </div>
  )
}
