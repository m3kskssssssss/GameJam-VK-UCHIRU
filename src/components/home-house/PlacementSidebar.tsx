'use client'
// Phase 6 — Horizontal scrollable sidebar showing unplaced FURNITURE items.
// Visible in placement-edit mode. Tap an item to select it; tap again to deselect.

import { ru } from '@/i18n/ru'
import { getCatalogItem } from '@/server/content/catalog'
import type { InventoryItemSummary } from '@/server/actions/rooms'

const t = ru.home

// ---- Helpers ----------------------------------------------------------------

function displayName(catalogKey: string): string {
  return getCatalogItem(catalogKey)?.name ?? catalogKey
}

// ---- Props ------------------------------------------------------------------

export interface PlacementSidebarProps {
  /** All inventory items (any category). The sidebar filters for FURNITURE. */
  inventory: InventoryItemSummary[]
  /** Currently selected item id, or null if nothing is selected. */
  selectedItemId: string | null
  onSelectItem: (itemId: string | null) => void
}

// ---- Component --------------------------------------------------------------

export function PlacementSidebar({
  inventory,
  selectedItemId,
  onSelectItem,
}: PlacementSidebarProps) {
  const furnitureItems = inventory.filter((i) => i.category === 'FURNITURE')

  return (
    <div
      aria-label={t.placementSidebar}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        paddingTop: '0.25rem',
      }}
    >
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'rgba(60,60,60,0.7)',
          fontFamily: 'Nunito, sans-serif',
          paddingLeft: '0.1rem',
        }}
      >
        {t.placementSidebar}
      </span>

      <div
        style={{
          overflowX: 'auto',
          display: 'flex',
          gap: '0.4rem',
          paddingBottom: '0.25rem',
          // Keep the scrollbar thin and unobtrusive on mobile
          scrollbarWidth: 'thin',
        }}
      >
        {furnitureItems.length === 0 ? (
          <span
            style={{
              fontSize: '0.8rem',
              color: '#888',
              fontFamily: 'Nunito, sans-serif',
              whiteSpace: 'nowrap',
              padding: '0.25rem 0',
            }}
          >
            {t.placementEmpty}
          </span>
        ) : (
          furnitureItems.map((item) => {
            const isSelected = selectedItemId === item.id
            const isAlreadyPlaced = item.isPlaced

            return (
              <button
                key={item.id}
                onClick={() =>
                  onSelectItem(isSelected ? null : item.id)
                }
                aria-pressed={isSelected}
                aria-label={`${displayName(item.catalogKey)}${isAlreadyPlaced ? ' (уже стоит)' : ''}`}
                style={{
                  flexShrink: 0,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.65rem',
                  border: isSelected
                    ? '2px solid #4DA8DA'
                    : '1.5px solid rgba(229,223,210,0.8)',
                  background: isSelected
                    ? 'rgba(77,168,218,0.18)'
                    : 'rgba(255,255,255,0.88)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isAlreadyPlaced ? '#aaa' : '#1F2937',
                  fontFamily: 'Nunito, sans-serif',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(77,168,218,0.25)'
                    : '0 1px 4px rgba(31,41,55,0.08)',
                  transition: 'border 0.1s, background 0.1s, box-shadow 0.1s',
                }}
              >
                {displayName(item.catalogKey)}
                {isAlreadyPlaced ? ' ✓' : ''}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
