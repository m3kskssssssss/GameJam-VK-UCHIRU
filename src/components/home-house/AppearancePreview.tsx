'use client'

import { Scissors, Shirt, PersonStanding, PawPrint } from 'lucide-react'
import { getCatalogItem } from '@/server/content/catalog'

export interface AppearancePreviewProps {
  appearance: {
    hair: string
    top: string
    bottom: string
    petKey: string | null
  }
}

interface SlotConfig {
  label: string
  key: string | null
  icon: React.ReactNode
  nullLabel?: string
}

export function AppearancePreview({ appearance }: AppearancePreviewProps) {
  const slots: SlotConfig[] = [
    {
      label: 'Волосы',
      key: appearance.hair,
      icon: <Scissors className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    {
      label: 'Верх',
      key: appearance.top,
      icon: <Shirt className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    {
      label: 'Низ',
      key: appearance.bottom,
      icon: <PersonStanding className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    {
      label: 'Питомец',
      key: appearance.petKey,
      icon: <PawPrint className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
      nullLabel: 'Без питомца',
    },
  ]

  return (
    <div
      className="flex flex-row flex-wrap gap-2 rounded-lg border bg-muted/40 p-3"
      aria-label="Текущий образ"
    >
      {slots.map((slot) => {
        const displayName =
          slot.key != null
            ? (getCatalogItem(slot.key)?.name ?? slot.key)
            : (slot.nullLabel ?? '—')

        return (
          <div
            key={slot.label}
            className="flex min-w-[90px] flex-1 items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 text-xs shadow-sm"
          >
            {slot.icon}
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-muted-foreground">{slot.label}</span>
              <span className="font-semibold text-foreground">{displayName}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
