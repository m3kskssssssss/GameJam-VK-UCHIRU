'use client'
// Phase 6 — Main client shell for /play/home.
// Orchestrates HomeHud, RoomGrid, ShopModal, WardrobeModal,
// PlacementSidebar, and RoomTabs.
// All server-action calls are lifted here; children receive plain data + handlers.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ru } from '@/i18n/ru'
import { placeItem, removePlacement, unlockRoom } from '@/server/actions/rooms'
import type { RoomSummary, InventoryItemSummary } from '@/server/actions/rooms'
import type { BuyResult, AppearanceResult } from '@/server/actions/shop'
import { HomeHud } from './HomeHud'
import { RoomGrid } from './RoomGrid'
import { RoomTabs } from './RoomTabs'
import { PlacementSidebar } from './PlacementSidebar'
import { ShopModal } from './ShopModal'
import { WardrobeModal } from './WardrobeModal'

const _t = ru.home

// ---- Types ------------------------------------------------------------------

export interface AppearanceState {
  hair: string
  top: string
  bottom: string
  petKey: string | null
}

export interface MainHouseProps {
  initialRooms: RoomSummary[]
  initialInventory: InventoryItemSummary[]
  initialAppearance: AppearanceState
  coins: number
  energy: number
  homeLevel: number
}

// ---- Component --------------------------------------------------------------

export function MainHouse({
  initialRooms,
  initialInventory,
  initialAppearance,
  coins: initialCoins,
  energy: initialEnergy,
  homeLevel,
}: MainHouseProps) {
  const router = useRouter()

  // ── Local state mirrors ──────────────────────────────────────────────────
  const [rooms, setRooms] = useState<RoomSummary[]>(initialRooms)
  const [inventory, setInventory] = useState<InventoryItemSummary[]>(initialInventory)
  const [appearance, setAppearance] = useState<AppearanceState>(initialAppearance)
  const [coins, setCoins] = useState(initialCoins)
  const [energy, setEnergy] = useState(initialEnergy)

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeRoomIndex, setActiveRoomIndex] = useState(0)
  const [placementMode, setPlacementMode] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [wardrobeOpen, setWardrobeOpen] = useState(false)

  const activeRoom = rooms.find((r) => r.index === activeRoomIndex)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBoughtItem = useCallback(
    (result: BuyResult) => {
      setCoins(result.newCoins)
      setEnergy(result.newEnergy)
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
    [],
  )

  const handleAppearanceChange = useCallback((a: AppearanceResult) => {
    setAppearance({ hair: a.hair, top: a.top, bottom: a.bottom, petKey: a.petKey })
  }, [])

  const handlePlaceItem = useCallback(
    async (itemId: string, x: number, y: number) => {
      if (!activeRoom) return
      try {
        const result = await placeItem({ itemId, roomId: activeRoom.id, x, y })
        setRooms((prev) =>
          prev.map((r) => {
            if (r.id !== activeRoom.id) return r
            // Remove any existing placement for this item then add the new one.
            const filtered = r.placements.filter((p) => p.itemId !== itemId)
            return { ...r, placements: [...filtered, result.placement] }
          }),
        )
        setInventory((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isPlaced: true } : i)),
        )
        setSelectedItemId(null)
      } catch {
        // Placement failed (cell occupied, etc.) — silently ignore for now.
      }
    },
    [activeRoom],
  )

  const handleRemovePlacement = useCallback(async (itemId: string) => {
    try {
      await removePlacement({ itemId })
      setRooms((prev) =>
        prev.map((r) => ({
          ...r,
          placements: r.placements.filter((p) => p.itemId !== itemId),
        })),
      )
      setInventory((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isPlaced: false } : i)),
      )
      setSelectedItemId(null)
    } catch {
      // Silently ignore.
    }
  }, [])

  const handleUnlockRoom = useCallback(
    async (index: number) => {
      setUnlocking(true)
      try {
        await unlockRoom({ index })
        setRooms((prev) => {
          const exists = prev.find((r) => r.index === index)
          if (exists) {
            return prev.map((r) =>
              r.index === index ? { ...r, unlocked: true } : r,
            )
          }
          return [
            ...prev,
            { id: '', index, unlocked: true, placements: [] },
          ]
        })
        setCoins((c) => c - 200)
        // Auto-switch to the newly unlocked room.
        setActiveRoomIndex(index)
      } catch {
        // Insufficient coins, level too low, or already unlocked — ignore silently.
      } finally {
        setUnlocking(false)
      }
    },
    [],
  )

  const handleExitToWorld = useCallback(() => {
    router.refresh()
    router.push('/play')
  }, [router])

  const handleGoToLobby = useCallback(() => {
    router.push('/play/lobby')
  }, [router])

  // ── Cell tap: place selected item ─────────────────────────────────────────

  const handleCellTap = useCallback(
    (x: number, y: number) => {
      if (!placementMode || !selectedItemId) return
      void handlePlaceItem(selectedItemId, x, y)
    },
    [placementMode, selectedItemId, handlePlaceItem],
  )

  const handlePlacedItemTap = useCallback(
    (itemId: string) => {
      if (placementMode) {
        void handleRemovePlacement(itemId)
      }
    },
    [placementMode, handleRemovePlacement],
  )

  const handleTogglePlacement = useCallback(() => {
    setPlacementMode((prev) => !prev)
    setSelectedItemId(null)
  }, [])

  const handleSelectRoom = useCallback((index: number) => {
    setActiveRoomIndex(index)
    setSelectedItemId(null)
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100dvw',
        fontFamily: 'Nunito, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Top HUD + bottom nav bar ── */}
      <HomeHud
        coins={coins}
        energy={energy}
        homeLevel={homeLevel}
        placementMode={placementMode}
        onOpenWardrobe={() => setWardrobeOpen(true)}
        onOpenShop={() => setShopOpen(true)}
        onTogglePlacement={handleTogglePlacement}
        onExit={handleExitToWorld}
        onLobby={handleGoToLobby}
      />

      {/* ── Middle: room tabs + grid + placement sidebar ── */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '0.75rem',
          gap: '0.5rem',
        }}
      >
        {/* Task 6.8: Room tabs */}
        <RoomTabs
          rooms={rooms}
          activeRoomIndex={activeRoomIndex}
          homeLevel={homeLevel}
          coins={coins}
          unlocking={unlocking}
          onSelectRoom={handleSelectRoom}
          onUnlockRoom={handleUnlockRoom}
        />

        {/* Room grid */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
          <RoomGrid
            room={activeRoom}
            inventory={inventory}
            placementMode={placementMode}
            selectedItemId={selectedItemId}
            petKey={appearance.petKey}
            onCellTap={handleCellTap}
            onPlacedItemTap={handlePlacedItemTap}
          />
        </div>

        {/* Task 6.7: Placement sidebar — visible in placement mode */}
        {placementMode && (
          <PlacementSidebar
            inventory={inventory}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <ShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        inventory={inventory}
        coins={coins}
        energy={energy}
        onBought={handleBoughtItem}
      />

      <WardrobeModal
        open={wardrobeOpen}
        onClose={() => setWardrobeOpen(false)}
        inventory={inventory}
        appearance={appearance}
        onChanged={handleAppearanceChange}
      />
    </div>
  )
}
