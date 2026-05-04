// Static item catalog. Pure data — no 'use server', safe to import in client
// components for read-only display.

import type { ItemCategory } from '@prisma/client'

export interface CatalogItem {
  key: string
  name: string // Russian display name
  category: ItemCategory
  priceCoins: number
  priceEnergy?: number // optional energy cost (currently unused — tv_old gives +10 energy as reward, not a cost)
  freeOnSpawn?: boolean // true → owned from child creation, equippable without InventoryItem
}

export const CATALOG: CatalogItem[] = [
  // -------------------------------------------------------------------------
  // Furniture (GAME_DESIGN line 78)
  // -------------------------------------------------------------------------
  { key: 'chair_simple',  name: 'Простой стул',     category: 'FURNITURE', priceCoins: 20 },
  { key: 'table_simple',  name: 'Стол',             category: 'FURNITURE', priceCoins: 30 },
  { key: 'bed_simple',    name: 'Кровать',          category: 'FURNITURE', priceCoins: 50 },
  { key: 'lamp_classic',  name: 'Лампа',            category: 'FURNITURE', priceCoins: 15 },
  { key: 'rug_warm',      name: 'Тёплый ковёр',     category: 'FURNITURE', priceCoins: 25 },
  { key: 'bookshelf',     name: 'Книжная полка',    category: 'FURNITURE', priceCoins: 40 },
  { key: 'tv_old',        name: 'Старый телевизор', category: 'FURNITURE', priceCoins: 60 },

  // -------------------------------------------------------------------------
  // Hair — 3 free + 3 premium (GAME_DESIGN line 79)
  // -------------------------------------------------------------------------
  { key: 'hair_default', name: 'Базовая причёска', category: 'OUTFIT_HAIR', priceCoins: 0,  freeOnSpawn: true },
  { key: 'hair_short',   name: 'Короткая',         category: 'OUTFIT_HAIR', priceCoins: 0,  freeOnSpawn: true },
  { key: 'hair_curly',   name: 'Кудри',            category: 'OUTFIT_HAIR', priceCoins: 0,  freeOnSpawn: true },
  { key: 'hair_blue',    name: 'Синяя причёска',   category: 'OUTFIT_HAIR', priceCoins: 30 },
  { key: 'hair_pink',    name: 'Розовая причёска', category: 'OUTFIT_HAIR', priceCoins: 30 },
  { key: 'hair_long',    name: 'Длинная',          category: 'OUTFIT_HAIR', priceCoins: 30 },

  // -------------------------------------------------------------------------
  // Top — 4 free + 3 premium (GAME_DESIGN line 80)
  // -------------------------------------------------------------------------
  { key: 'top_default', name: 'Базовая футболка', category: 'OUTFIT_TOP', priceCoins: 0,  freeOnSpawn: true },
  { key: 'top_red',     name: 'Красная футболка', category: 'OUTFIT_TOP', priceCoins: 0,  freeOnSpawn: true },
  { key: 'top_green',   name: 'Зелёная футболка', category: 'OUTFIT_TOP', priceCoins: 0,  freeOnSpawn: true },
  { key: 'top_blue',    name: 'Синяя футболка',   category: 'OUTFIT_TOP', priceCoins: 0,  freeOnSpawn: true },
  { key: 'top_hoodie',  name: 'Худи',             category: 'OUTFIT_TOP', priceCoins: 30 },
  { key: 'top_jacket',  name: 'Куртка',           category: 'OUTFIT_TOP', priceCoins: 30 },
  { key: 'top_dress',   name: 'Платье',           category: 'OUTFIT_TOP', priceCoins: 30 },

  // -------------------------------------------------------------------------
  // Bottom — 4 free + 3 premium (GAME_DESIGN line 81)
  // -------------------------------------------------------------------------
  { key: 'bottom_default',      name: 'Базовые штаны',     category: 'OUTFIT_BOTTOM', priceCoins: 0,  freeOnSpawn: true },
  { key: 'bottom_jeans',        name: 'Джинсы',            category: 'OUTFIT_BOTTOM', priceCoins: 0,  freeOnSpawn: true },
  { key: 'bottom_shorts',       name: 'Шорты',             category: 'OUTFIT_BOTTOM', priceCoins: 0,  freeOnSpawn: true },
  { key: 'bottom_skirt',        name: 'Юбка',              category: 'OUTFIT_BOTTOM', priceCoins: 0,  freeOnSpawn: true },
  { key: 'bottom_pants_warm',   name: 'Тёплые штаны',      category: 'OUTFIT_BOTTOM', priceCoins: 30 },
  { key: 'bottom_pants_sport',  name: 'Спортивные',        category: 'OUTFIT_BOTTOM', priceCoins: 30 },
  { key: 'bottom_pants_jeans2', name: 'Чёрные джинсы',     category: 'OUTFIT_BOTTOM', priceCoins: 30 },

  // -------------------------------------------------------------------------
  // Pets — 3 at 100 coins each (GAME_DESIGN line 82)
  // -------------------------------------------------------------------------
  { key: 'cat',    name: 'Котик',  category: 'PET', priceCoins: 2500 },
  { key: 'dog',    name: 'Собака', category: 'PET', priceCoins: 3000 },
  { key: 'dragon', name: 'Дракон', category: 'PET', priceCoins: 3500 },

  // -------------------------------------------------------------------------
  // Promo codes — partner subscriptions priced from 1000 coins.
  // Visual-only ownership for now; redemption flow lives outside the game.
  // -------------------------------------------------------------------------
  { key: 'promo_ivi',          name: 'IVI — подписка',     category: 'PROMO', priceCoins: 1000 },
  { key: 'promo_vk_music',     name: 'VK Music',           category: 'PROMO', priceCoins: 1500 },
  { key: 'promo_yandex_plus',  name: 'Яндекс Плюс',        category: 'PROMO', priceCoins: 2000 },
  { key: 'promo_yandex_eda',   name: 'Яндекс Еда',         category: 'PROMO', priceCoins: 2500 },
]

export function getCatalogItem(key: string): CatalogItem | undefined {
  return CATALOG.find((it) => it.key === key)
}

export function listCatalogByCategory(category: ItemCategory): CatalogItem[] {
  return CATALOG.filter((it) => it.category === category)
}
