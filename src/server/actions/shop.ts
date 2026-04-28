'use server'
// Shop server actions: browse catalog, purchase items, update character appearance.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import { getCatalogItem, CATALOG } from '@/server/content/catalog'
import type { CatalogItem } from '@/server/content/catalog'

// ---------------------------------------------------------------------------
// listCatalog
// ---------------------------------------------------------------------------

/**
 * Returns the full static catalog. Gated to authenticated children so
 * anonymous requests cannot enumerate items even though the data is
 * non-sensitive.
 */
export async function listCatalog(): Promise<CatalogItem[]> {
  await requireChild()
  return CATALOG
}

// ---------------------------------------------------------------------------
// buyItem
// ---------------------------------------------------------------------------

const BuyItemSchema = z.object({
  catalogKey: z.string().min(1),
})

export type BuyResult = {
  ok: true
  item: { id: string; catalogKey: string; category: string }
  newCoins: number
  newEnergy: number
}

export async function buyItem(input: { catalogKey: string }): Promise<BuyResult> {
  const parsed = BuyItemSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()

  const catalogItem = getCatalogItem(parsed.data.catalogKey)
  if (!catalogItem) throw new Error('ITEM_NOT_FOUND')

  // Free-on-spawn items cannot be purchased — they are owned implicitly.
  if (catalogItem.freeOnSpawn) throw new Error('ITEM_IS_FREE')

  return prisma.$transaction(async (tx) => {
    // Re-read inside transaction to get a consistent balance.
    const fresh = await tx.child.findUnique({
      where: { id: child.id },
      select: { coins: true, energy: true },
    })
    if (!fresh) throw new Error('CHILD_NOT_FOUND')

    const energyCost = catalogItem.priceEnergy ?? 0

    if (fresh.coins < catalogItem.priceCoins) throw new Error('INSUFFICIENT_COINS')
    if (fresh.energy < energyCost) throw new Error('INSUFFICIENT_ENERGY')

    // Prevent duplicate ownership of the same catalog key.
    const alreadyOwned = await tx.inventoryItem.findFirst({
      where: { childId: child.id, catalogKey: catalogItem.key },
      select: { id: true },
    })
    if (alreadyOwned) throw new Error('ALREADY_OWNED')

    // Debit balance.
    const updated = await tx.child.update({
      where: { id: child.id },
      data: {
        coins: { decrement: catalogItem.priceCoins },
        ...(energyCost > 0 && { energy: { decrement: energyCost } }),
      },
      select: { coins: true, energy: true },
    })

    // Create inventory record.
    const created = await tx.inventoryItem.create({
      data: {
        childId: child.id,
        catalogKey: catalogItem.key,
        category: catalogItem.category,
      },
    })

    return {
      ok: true as const,
      item: {
        id: created.id,
        catalogKey: created.catalogKey,
        category: created.category as string,
      },
      newCoins: updated.coins,
      newEnergy: updated.energy,
    }
  })
}

// ---------------------------------------------------------------------------
// setAppearance
// ---------------------------------------------------------------------------

const SetAppearanceSchema = z.object({
  hair:   z.string().optional(),
  top:    z.string().optional(),
  bottom: z.string().optional(),
  pet:    z.string().nullable().optional(),
})

export type AppearanceResult = {
  ok: true
  hair: string
  top: string
  bottom: string
  petKey: string | null
}

export async function setAppearance(input: {
  hair?: string
  top?: string
  bottom?: string
  pet?: string | null
}): Promise<AppearanceResult> {
  const parsed = SetAppearanceSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const child = await requireChild()

  // Validate that the child actually owns each non-free item they want to equip.
  async function assertOwnedOrFree(key: string, expectedCategory: string): Promise<void> {
    const cat = getCatalogItem(key)
    if (!cat) throw new Error('ITEM_NOT_FOUND')
    if (cat.category !== expectedCategory) throw new Error('CATEGORY_MISMATCH')
    if (cat.freeOnSpawn) return // free items are always equippable

    const owned = await prisma.inventoryItem.findFirst({
      where: { childId: child.id, catalogKey: key },
      select: { id: true },
    })
    if (!owned) throw new Error('NOT_OWNED')
  }

  if (parsed.data.hair   !== undefined) await assertOwnedOrFree(parsed.data.hair,   'OUTFIT_HAIR')
  if (parsed.data.top    !== undefined) await assertOwnedOrFree(parsed.data.top,     'OUTFIT_TOP')
  if (parsed.data.bottom !== undefined) await assertOwnedOrFree(parsed.data.bottom,  'OUTFIT_BOTTOM')
  // pet: null means "unequip pet" — no ownership check needed for null
  if (parsed.data.pet    != null)       await assertOwnedOrFree(parsed.data.pet,     'PET')

  const updated = await prisma.characterAppearance.upsert({
    where: { childId: child.id },
    create: {
      childId: child.id,
      hair:   parsed.data.hair   ?? 'hair_default',
      top:    parsed.data.top    ?? 'top_default',
      bottom: parsed.data.bottom ?? 'bottom_default',
      petKey: parsed.data.pet    ?? null,
    },
    update: {
      ...(parsed.data.hair   !== undefined && { hair:   parsed.data.hair }),
      ...(parsed.data.top    !== undefined && { top:    parsed.data.top }),
      ...(parsed.data.bottom !== undefined && { bottom: parsed.data.bottom }),
      ...(parsed.data.pet    !== undefined && { petKey: parsed.data.pet }),
    },
  })

  return {
    ok: true,
    hair:   updated.hair,
    top:    updated.top,
    bottom: updated.bottom,
    petKey: updated.petKey,
  }
}
