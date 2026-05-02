'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { listCatalogByCategory } from '@/server/content/catalog'
import type { ItemCategory } from '@prisma/client'
import type { InventoryItemSummary } from '@/server/actions/rooms'
import { buyItem } from '@/server/actions/shop'
import type { BuyResult } from '@/server/actions/shop'
import { ru } from '@/i18n/ru'
import { ShopItemCard } from './ShopItemCard'

const t = ru.home

// ---- Types ------------------------------------------------------------------

export interface ShopModalProps {
  open: boolean
  onClose: () => void
  inventory: InventoryItemSummary[]
  coins: number
  energy: number
  onBought: (result: BuyResult) => void
}

// ---- Tab definitions --------------------------------------------------------

interface TabDef {
  value: ItemCategory
  label: string
}

// Outfit (hair/top/bottom) tabs are intentionally omitted — clothing is no
// longer for sale. Promo codes (partner subscriptions) take their slot.
const TABS: TabDef[] = [
  { value: 'FURNITURE', label: t.tabFurniture },
  { value: 'PET',       label: t.tabPets },
  { value: 'PROMO',     label: t.tabPromo },
]

// ---- Error key → i18n -------------------------------------------------------

function mapErrorKey(message: string): string {
  if (message === 'INSUFFICIENT_COINS' || message === 'INSUFFICIENT_ENERGY') {
    return t.errorInsufficientFunds
  }
  if (message === 'ALREADY_OWNED') {
    return t.errorAlreadyOwned
  }
  return t.errorGeneric
}

// ---- Currency pill ----------------------------------------------------------

function CurrencyPill({
  icon,
  value,
}: {
  icon: string
  value: number
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-bold text-foreground">
      <span>{icon}</span>
      <span>{value}</span>
    </span>
  )
}

// ---- Tab panel (grid of cards) ----------------------------------------------

interface TabPanelProps {
  category: ItemCategory
  inventory: InventoryItemSummary[]
  coins: number
  energy: number
  loadingKey: string | null
  onBuy: (catalogKey: string) => void
}

function TabPanel({
  category,
  inventory,
  coins,
  energy,
  loadingKey,
  onBuy,
}: TabPanelProps) {
  const items = listCatalogByCategory(category)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => {
        const isOwned =
          item.freeOnSpawn === true ||
          inventory.some((i) => i.catalogKey === item.key)
        const canAfford =
          coins >= item.priceCoins &&
          energy >= (item.priceEnergy ?? 0)

        return (
          <ShopItemCard
            key={item.key}
            item={item}
            isOwned={isOwned}
            canAfford={canAfford}
            loading={loadingKey === item.key}
            onBuy={() => onBuy(item.key)}
          />
        )
      })}
    </div>
  )
}

// ---- ShopModal --------------------------------------------------------------

export function ShopModal({
  open,
  onClose,
  inventory,
  coins,
  energy,
  onBought,
}: ShopModalProps) {
  const [activeTab, setActiveTab] = useState<ItemCategory>('FURNITURE')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleBuy = (catalogKey: string) => {
    if (isPending || loadingKey !== null) return
    setLoadingKey(catalogKey)

    startTransition(async () => {
      try {
        const result = await buyItem({ catalogKey })
        onBought(result)
        toast.success(t.toastBought)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'UNKNOWN'
        toast.error(mapErrorKey(message), { duration: Infinity })
      } finally {
        setLoadingKey(null)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="flex flex-col max-h-[90dvh] w-full max-w-2xl gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle className="text-xl font-bold">{t.shopTitle}</DialogTitle>

          {/* Currency pills */}
          <div className="flex gap-2 pt-2">
            <CurrencyPill icon="🪙" value={coins} />
            <CurrencyPill icon="⚡" value={energy} />
          </div>
        </DialogHeader>

        {/* Tabs + scrollable content */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ItemCategory)}
          className="flex flex-col min-h-0 flex-1"
        >
          <TabsList className="mx-6 mb-2 shrink-0 flex-wrap h-auto gap-1 justify-start">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="overflow-y-auto flex-1 px-6 pb-6">
            {TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <TabPanel
                  category={tab.value}
                  inventory={inventory}
                  coins={coins}
                  energy={energy}
                  loadingKey={loadingKey}
                  onBuy={handleBuy}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
