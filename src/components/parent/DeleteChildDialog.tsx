'use client'
// DeleteChildDialog — destructive confirm dialog for removing a child account.
// Calls the deleteChild server action then redirects to /parent.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteChild } from '@/server/actions/children'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

interface DeleteChildDialogProps {
  childId: string
  childName: string
}

export function DeleteChildDialog({ childId, childName }: DeleteChildDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteChild({ childId })
        setOpen(false)
        router.push('/parent')
        router.refresh()
      } catch {
        setError(ru.auth.errors.unexpected)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {p.btnDelete}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{p.deleteTitle}</DialogTitle>
          <DialogDescription>
            {p.deleteDescription}
            <br />
            <strong className="text-foreground">{childName}</strong>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {p.btnCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? ru.auth.btnLoading : p.btnDeleteConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
