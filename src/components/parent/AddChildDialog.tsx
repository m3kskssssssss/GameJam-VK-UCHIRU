'use client'
// AddChildDialog — wraps AddChildForm inside a shadcn Dialog.
// Opens on button click; closes on successful form submit.
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AddChildForm } from '@/components/auth/AddChildForm'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

interface AddChildDialogProps {
  /** Optional custom trigger label. Defaults to p.btnAddChildDialog. */
  triggerLabel?: string
  /** Extra classes for the trigger button. */
  className?: string
}

export function AddChildDialog({ triggerLabel, className }: AddChildDialogProps) {
  const [open, setOpen] = useState(false)

  function handleSuccess() {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          {triggerLabel ?? p.btnAddChildDialog}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{p.addChildTitle}</DialogTitle>
          <DialogDescription>{p.addChildDescription}</DialogDescription>
        </DialogHeader>

        <AddChildForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
