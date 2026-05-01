'use client'
// ManageRelativeSheet — Sheet from right for managing a single relative.
// Contains: AvatarUploader, reset-password form, delete with confirm.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { AvatarUploader } from '@/components/parent/AvatarUploader'
import { setRelativeAvatar } from '@/server/actions/avatars'
import { resetRelativePassword, deleteRelative } from '@/server/actions/relatives'
import { ru } from '@/i18n/ru'

const { parent: p, auth: at } = ru
const r = p.relatives

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
})
type ResetFormValues = z.infer<typeof resetPasswordSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ManageRelativeSheetProps {
  relativeId: string
  relativeName: string
  relativeUsername: string
  relativeAvatarUrl: string | null
  open: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ManageRelativeSheet({
  relativeId,
  relativeName,
  relativeUsername,
  relativeAvatarUrl,
  open,
  onClose,
}: ManageRelativeSheetProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isResettingPw, startResetTransition] = useTransition()

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleAvatarUploaded(data: { url: string; key: string }) {
    await setRelativeAvatar({
      relativeId,
      photoUrl: data.url,
      photoKey: data.key,
    })
    router.refresh()
  }

  function handleResetPassword(values: ResetFormValues) {
    startResetTransition(async () => {
      try {
        await resetRelativePassword({ id: relativeId, newPassword: values.newPassword })
        toast.success(r.resetPasswordSuccess)
        resetForm.reset()
      } catch {
        toast.error(p.profile.errorGeneric)
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteRelative({ id: relativeId })
        toast.success(r.deleteSuccess)
        setDeleteDialogOpen(false)
        onClose()
        router.refresh()
      } catch {
        toast.error(p.profile.errorGeneric)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col gap-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{r.manageTitle}: {relativeName}</SheetTitle>
          </SheetHeader>

          {/* Avatar uploader */}
          <div className="flex justify-center">
            <AvatarUploader
              initialUrl={relativeAvatarUrl}
              fallbackInitials={relativeName}
              target="relative"
              targetId={relativeId}
              onUploaded={handleAvatarUploaded}
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">@{relativeUsername}</p>

          <Separator />

          {/* Reset password form */}
          <section aria-label={r.resetPasswordTitle}>
            <h3 className="text-sm font-semibold mb-3">
              {r.resetPasswordTitle} {relativeName}
            </h3>
            <Form {...resetForm}>
              <form
                onSubmit={resetForm.handleSubmit(handleResetPassword)}
                className="space-y-3"
              >
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{r.labelNewPassword}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isResettingPw}
                >
                  {isResettingPw ? at.btnLoading : r.btnSavePassword}
                </Button>
              </form>
            </Form>
          </section>

          <Separator />

          {/* Delete */}
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="w-full"
          >
            {r.btnDelete}
          </Button>
        </SheetContent>
      </Sheet>

      {/* Confirm delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{r.deleteTitle}</DialogTitle>
            <DialogDescription>
              {r.deleteDescription}{' '}
              <strong className="text-foreground">{relativeName}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {r.btnCancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? at.btnLoading : r.btnDeleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
