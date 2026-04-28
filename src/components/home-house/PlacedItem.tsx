'use client'
// Phase 6 — Visual representation of a placed furniture item on the room grid.
// Rendered inside a grid cell by RoomGrid when a placement exists for that cell.

import { ru } from '@/i18n/ru'
import { getCatalogItem } from '@/server/content/catalog'

const t = ru.home

// ---- Helpers ----------------------------------------------------------------

/** Single uppercase letter derived from a catalog key — used as placeholder. */
function shortLabel(catalogKey: string): string {
  const parts = catalogKey.split('_')
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

/** Resolve a human-readable name from catalog, falling back to the raw key. */
function displayName(catalogKey: string): string {
  return getCatalogItem(catalogKey)?.name ?? catalogKey
}

// ---- Props ------------------------------------------------------------------

export interface PlacedItemProps {
  /** Inventory item id (passed back to onTap so the parent can remove it). */
  itemId: string
  catalogKey: string
  /** When true the parent is in placement-edit mode — show a remove hint. */
  inEditMode: boolean
  onTap: (itemId: string) => void
}

// ---- Component --------------------------------------------------------------

export function PlacedItem({ itemId, catalogKey, inEditMode, onTap }: PlacedItemProps) {
  const label = shortLabel(catalogKey)
  const name = displayName(catalogKey)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        inEditMode
          ? `${name} — нажми чтобы убрать`
          : name
      }
      onClick={() => onTap(itemId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap(itemId)
        }
      }}
      title={inEditMode ? `${name} (${t.toastRemoved})` : name}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: inEditMode
          ? 'rgba(255, 107, 107, 0.75)'
          : 'rgba(77, 168, 218, 0.85)',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#fff',
        fontFamily: 'Nunito, sans-serif',
        userSelect: 'none',
        transition: 'background 0.15s',
        outline: 'none',
      }}
    >
      {label}
    </div>
  )
}
