'use client'
// ChangePasswordForm — form for changing parent or relative password.
// Calls the appropriate server action based on the `role` prop.
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { changeParentPassword, changeRelativePassword } from '@/server/actions/profile'
import { ru } from '@/i18n/ru'

const { parent: p, auth: at } = ru
const prof = p.profile

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChangePasswordFormProps {
  role: 'parent' | 'relative'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChangePasswordForm({ role }: ChangePasswordFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        if (role === 'parent') {
          await changeParentPassword(values)
        } else {
          await changeRelativePassword(values)
        }
        toast.success(prof.changePasswordSuccess)
        form.reset()
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'INVALID_PASSWORD') {
          form.setError('currentPassword', { message: prof.errorInvalidPassword })
        } else {
          toast.error(prof.errorGeneric)
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{prof.labelCurrentPassword}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={prof.placeholderCurrentPassword}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{prof.labelNewPassword}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={prof.placeholderNewPassword}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? at.btnLoading : prof.btnSave}
        </Button>
      </form>
    </Form>
  )
}
