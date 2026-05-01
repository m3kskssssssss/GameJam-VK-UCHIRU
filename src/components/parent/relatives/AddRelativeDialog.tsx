'use client'
// AddRelativeDialog — dialog with form to create a new relative account.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createRelative } from '@/server/actions/relatives'
import { ru } from '@/i18n/ru'

const { parent: p, auth: at } = ru
const r = p.relatives

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  username: z.string().trim().min(3).max(64).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Только буквы, цифры, _ и -',
  ),
  displayName: z.string().trim().min(1).max(64),
  password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddRelativeDialogProps {
  triggerLabel?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddRelativeDialog({ triggerLabel }: AddRelativeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', displayName: '', password: '' },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createRelative(values)
        toast.success(r.addSuccess)
        setOpen(false)
        form.reset()
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ERROR'
        if (msg === 'USERNAME_TAKEN') {
          form.setError('username', { message: r.errorUsernameTaken })
        } else {
          toast.error(p.profile.errorGeneric)
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel ?? r.btnAdd}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{r.addTitle}</DialogTitle>
          <DialogDescription>{r.addDescription}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.labelUsername}</FormLabel>
                  <FormControl>
                    <Input placeholder={r.placeholderUsername} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.labelDisplayName}</FormLabel>
                  <FormControl>
                    <Input placeholder={r.placeholderDisplayName} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.labelPassword}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? at.btnLoading : r.btnAdd}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
