'use server'
// Room server actions: inventory, room listing, unlocking, and furniture placement.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface InventoryItemSummary {
  id: string
  catalogKey: string
  category: 'FURNITURE' | 'OUTFIT_HAIR' | 'OUTFIT_TOP' | 'OUTFIT_BOTTOM' | 'PET'
  isPlaced: boolean
  ownedAt: string // ISO string for client
}

export interface RoomPlacementSummary {
  id: string
  itemId: string
  catalogKey: string
  x: number
  y: number
  rotation: number
}

export interface RoomSummary {
  id: string
  index: number
  unlocked: boolean
  placements: RoomPlacementSummary[]
}

// ---------------------------------------------------------------------------
// listInventory
// ---------------------------------------------------------------------------

/**
 * Returns all inventory items owned by the authenticated child, with a flag
 * indicating whether each item is currently placed in a room.
 */
export async function listInventory(): Promise<InventoryItemSummary[]> {
  const child = await requireChild()

  const items = await prisma.inventoryItem.findMany({
    where: { childId: child.id },
    include: { placement: true },
    orderBy: { ownedAt: 'desc' },
  })

  return items.map((it) => ({
    id: it.id,
    catalogKey: it.catalogKey,
    category: it.category as InventoryItemSummary['category'],
    isPlaced: it.placement !== null,
    ownedAt: it.ownedAt.toISOString(),
  }))
}

// ---------------------------------------------------------------------------
// listRooms
// ---------------------------------------------------------------------------

/**
 * Returns all room records for the authenticated child.
 * Defensively seeds room index=0 (always unlocked) if no rooms exist yet,
 * using the created row's id directly to avoid a second DB round-trip.
 */
export async function listRooms(): Promise<RoomSummary[]> {
  const child = await requireChild()

  const existing = await prisma.room.findMany({
    where: { childId: child.id },
    include: {
      placements: {
        include: { item: { select: { catalogKey: true } } },
      },
    },
    orderBy: { index: 'asc' },
  })

  if (existing.length === 0) {
    const created = await prisma.room.create({
      data: { childId: child.id, index: 0, unlocked: true },
    })
    return [{ id: created.id, index: 0, unlocked: true, placements: [] }]
  }

  return existing.map((r) => ({
    id: r.id,
    index: r.index,
    unlocked: r.unlocked,
    placements: r.placements.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      catalogKey: p.item.catalogKey,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
    })),
  }))
}

// ---------------------------------------------------------------------------
// unlockRoom
// ---------------------------------------------------------------------------

// Game Design: second room costs 200 coins and requires homeLevel >= 2.
const ROOM_COST = 200
const REQUIRED_HOME_LEVEL = 2

const UnlockRoomSchema = z.object({
  index: z.number().int().min(1).max(1),
})

/**
 * Unlock the second room (index=1). Deducts 200 coins; requires homeLevel >= 2.
 * Idempotent error if already unlocked.
 */
export async function unlockRoom(input: { index: number }): Promise<{ ok: true }> {
  const parsed = UnlockRoomSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.child.findUnique({
      where: { id: child.id },
      select: { coins: true, homeLevel: true },
    })
    if (!fresh) throw new Error('CHILD_NOT_FOUND')
    if (fresh.homeLevel < REQUIRED_HOME_LEVEL) throw new Error('LEVEL_TOO_LOW')
    if (fresh.coins < ROOM_COST) throw new Error('INSUFFICIENT_COINS')

    const existing = await tx.room.findUnique({
      where: { childId_index: { childId: child.id, index: parsed.data.index } },
      select: { id: true, unlocked: true },
    })
    if (existing?.unlocked) throw new Error('ALREADY_UNLOCKED')

    await tx.child.update({
      where: { id: child.id },
      data: { coins: { decrement: ROOM_COST } },
    })

    if (existing) {
      await tx.room.update({
        where: { id: existing.id },
        data: { unlocked: true },
      })
    } else {
      await tx.room.create({
        data: { childId: child.id, index: parsed.data.index, unlocked: true },
      })
    }

    return { ok: true as const }
  })
}

// ---------------------------------------------------------------------------
// placeItem
// ---------------------------------------------------------------------------

const PlaceItemSchema = z.object({
  itemId: z.string().min(1),
  roomId: z.string().min(1),
  x: z.number().int().min(0).max(7),
  y: z.number().int().min(0).max(5),
  rotation: z.number().int().optional(),
})

/**
 * Place a FURNITURE item into a room at grid position (x, y).
 * An item can occupy only one placement at a time (upsert). Collisions at the
 * target cell are rejected. Non-furniture categories cannot be placed.
 */
export async function placeItem(input: {
  itemId: string
  roomId: string
  x: number
  y: number
  rotation?: number
}): Promise<{ ok: true; placement: RoomPlacementSummary }> {
  const parsed = PlaceItemSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()

  // Verify item ownership.
  const item = await prisma.inventoryItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { childId: true, catalogKey: true, category: true },
  })
  if (!item || item.childId !== child.id) throw new Error('ACCESS_DENIED')
  if (item.category !== 'FURNITURE') throw new Error('CANNOT_PLACE_NON_FURNITURE')

  // Verify room ownership and lock state.
  const room = await prisma.room.findUnique({
    where: { id: parsed.data.roomId },
    select: { childId: true, unlocked: true },
  })
  if (!room || room.childId !== child.id) throw new Error('ACCESS_DENIED')
  if (!room.unlocked) throw new Error('ROOM_LOCKED')

  // Check no OTHER item occupies the target cell (allow moving the same item).
  const collision = await prisma.roomPlacement.findFirst({
    where: {
      roomId: parsed.data.roomId,
      x: parsed.data.x,
      y: parsed.data.y,
      NOT: { itemId: parsed.data.itemId },
    },
  })
  if (collision) throw new Error('CELL_OCCUPIED')

  const placement = await prisma.roomPlacement.upsert({
    where: { itemId: parsed.data.itemId },
    create: {
      itemId: parsed.data.itemId,
      roomId: parsed.data.roomId,
      x: parsed.data.x,
      y: parsed.data.y,
      rotation: parsed.data.rotation ?? 0,
    },
    update: {
      roomId: parsed.data.roomId,
      x: parsed.data.x,
      y: parsed.data.y,
      rotation: parsed.data.rotation ?? 0,
    },
  })

  return {
    ok: true,
    placement: {
      id: placement.id,
      itemId: placement.itemId,
      catalogKey: item.catalogKey,
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation,
    },
  }
}

// ---------------------------------------------------------------------------
// removePlacement
// ---------------------------------------------------------------------------

const RemovePlacementSchema = z.object({
  itemId: z.string().min(1),
})

/**
 * Remove the placement record for a given inventory item. Ownership of the
 * item is verified before deletion. No-ops silently if no placement exists.
 */
export async function removePlacement(input: { itemId: string }): Promise<{ ok: true }> {
  const parsed = RemovePlacementSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()

  const item = await prisma.inventoryItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { childId: true },
  })
  if (!item || item.childId !== child.id) throw new Error('ACCESS_DENIED')

  await prisma.roomPlacement.deleteMany({ where: { itemId: parsed.data.itemId } })

  return { ok: true }
}
