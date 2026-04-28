'use client'

import type { CatalogItem } from '@/server/content/catalog'
import { ru } from '@/i18n/ru'

const t = ru.home

export interface ShopItemCardProps {
  item: CatalogItem
  isOwned: boolean
  canAfford: boolean
  loading: boolean
  onBuy: () => void
}

export function ShopItemCard({
  item,
  isOwned,
  canAfford,
  loading,
  onBuy,
}: ShopItemCardProps) {
  const isFree = item.freeOnSpawn === true
  const buttonDisabled = isFree || isOwned || !canAfford || loading

  return (
    <div
      className="flex flex-col justify-between rounded-xl border border-border bg-card p-3 gap-2"
      style={{ minHeight: '120px' }}
    >
      {/* Name + free badge */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-bold text-sm leading-snug text-foreground">
          {item.name}
        </span>
        {isFree && (
          <span className="shrink-0 rounded-full bg-[var(--color-success,#22c55e)] px-2 py-0.5 text-[10px] font-bold text-white">
            Бесплатно
          </span>
        )}
      </div>

      {/* Price row */}
      {!isFree && (
        <p className="text-xs text-muted-foreground">
          {t.pricePrefix}: {item.priceCoins} монет
          {(item.priceEnergy ?? 0) > 0 && (
            <span className="ml-1">+{item.priceEnergy} ⚡</span>
          )}
        </p>
      )}

      {/* Insufficient funds notice */}
      {!isFree && !isOwned && !canAfford && (
        <p className="text-xs text-destructive">{t.errorInsufficientFunds}</p>
      )}

      {/* Buy / owned button */}
      <button
        onClick={onBuy}
        disabled={buttonDisabled}
        aria-label={
          isFree
            ? 'Уже у тебя'
            : isOwned
            ? t.btnOwned
            : !canAfford
            ? t.errorInsufficientFunds
            : t.btnBuy
        }
        className={[
          'mt-auto w-full rounded-lg font-bold text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          // height — at least 56px touch target
          'min-h-[56px]',
          isOwned
            ? 'bg-[var(--color-success,#22c55e)] text-white opacity-80'
            : isFree
            ? 'bg-muted text-muted-foreground'
            : !canAfford
            ? 'bg-muted text-muted-foreground'
            : loading
            ? 'bg-primary/70 text-primary-foreground'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
        ].join(' ')}
      >
        {loading
          ? '...'
          : isFree
          ? 'Уже у тебя'
          : isOwned
          ? t.btnOwned
          : t.btnBuy}
      </button>
    </div>
  )
}
