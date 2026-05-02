'use client'
// Global shop entry point — bag icon stacked under the QuestBook in the
// world / lobby HUDs. Opens the same ShopModal used inside the home house,
// fetches inventory lazily, and pushes coin / energy updates back into the
// game store so the HUD pills stay in sync.

import { useCallback, useEffect, useState } from 'react'
import { ShopModal } from '@/components/home-house/ShopModal'
import { useGameStore } from '@/hooks/useGameStore'
import { listInventory } from '@/server/actions/rooms'
import type { InventoryItemSummary } from '@/server/actions/rooms'
import type { BuyResult } from '@/server/actions/shop'

interface GlobalShopProps {
  rightPx?: number
  topPx?: number
}

export function GlobalShop({ rightPx = 16, topPx = 16 }: GlobalShopProps) {
  const coins = useGameStore((s) => s.coins)
  const energy = useGameStore((s) => s.energy)
  const homeLevel = useGameStore((s) => s.homeLevel)
  const setSummary = useGameStore((s) => s.setSummary)

  const [open, setOpen] = useState(false)
  const [inventory, setInventory] = useState<InventoryItemSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  // Lazily fetch the inventory each time the dialog opens so freshly-bought
  // items show as owned without a router refresh.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)
    listInventory()
      .then((items) => {
        if (!cancelled) setInventory(items)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить инвентарь')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleBought = useCallback(
    (result: BuyResult) => {
      // Sync HUD pills with the new balance.
      setSummary({
        coins: result.newCoins,
        energy: result.newEnergy,
        homeLevel,
      })
      setInventory((prev) => [
        ...prev,
        {
          id: result.item.id,
          catalogKey: result.item.catalogKey,
          category: result.item.category as InventoryItemSummary['category'],
          isPlaced: false,
          ownedAt: new Date().toISOString(),
        },
      ])
    },
    [setSummary, homeLevel],
  )

  return (
    <>
      <button
        type="button"
        aria-label="Магазин"
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
        <ShopBagIcon />
      </button>

      <ShopModal
        open={open}
        onClose={() => setOpen(false)}
        inventory={inventory}
        coins={coins}
        energy={energy}
        onBought={handleBought}
      />

      {/* Out-of-flow error toast. The ShopModal also handles per-item errors
          via sonner; this is just for the inventory fetch failure. */}
      {error && open && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#FF6B6B',
            color: '#fff',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            padding: '8px 14px',
            borderRadius: 10,
            zIndex: 300,
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}
    </>
  )
}

function ShopBagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z"
        stroke="#1F2937"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6.5A3 3 0 0 1 12 3.5a3 3 0 0 1 3 3V8"
        stroke="#1F2937"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}
