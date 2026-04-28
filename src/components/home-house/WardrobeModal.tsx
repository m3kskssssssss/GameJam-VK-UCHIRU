'use client'
// TODO: implemented in Task 6.6

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { InventoryItemSummary } from '@/server/actions/rooms'
import type { AppearanceResult } from '@/server/actions/shop'
import { ru } from '@/i18n/ru'

const t = ru.home

export interface AppearanceState {
  hair: string
  top: string
  bottom: string
  petKey: string | null
}

export interface WardrobeModalProps {
  open: boolean
  onClose: () => void
  inventory: InventoryItemSummary[]
  appearance: AppearanceState
  onChanged: (result: AppearanceResult) => void
}

export function WardrobeModal({ open, onClose }: WardrobeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.wardrobeTitle}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center text-sm text-muted-foreground">
          {/* Full wardrobe UI implemented in Task 6.6 */}
          Гардероб скоро откроется
        </div>
      </DialogContent>
    </Dialog>
  )
}
