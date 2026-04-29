'use client'
// Form for parent to create a new child account
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createChild } from '@/server/actions/auth'
import { createChildSchema } from '@/lib/validation/auth'
import { ru } from '@/i18n/ru'

const { auth: t, parent: p } = ru

type FormValues = z.infer<typeof createChildSchema>

interface AddChildFormProps {
  /** Called after a successful child creation. Useful for closing dialogs. */
  onSuccess?: () => void
}

export function AddChildForm({ onSuccess }: AddChildFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(createChildSchema),
    defaultValues: { username: '', displayName: '', password: '', gender: 'BOY' },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createChild(values)
      if (result.ok) {
        form.reset()
        router.refresh()
        onSuccess?.()
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.labelUsername}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.placeholderUsername}
                  autoCapitalize="none"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t.usernameHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.labelDisplayName}</FormLabel>
              <FormControl>
                <Input placeholder={t.placeholderDisplayName} {...field} />
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
              <FormLabel>{t.labelPassword}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t.placeholderPassword}
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.labelGender}</FormLabel>
              <FormControl>
                <div className="flex gap-3">
                  <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 ${field.value === 'BOY' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <input
                      type="radio"
                      className="sr-only"
                      value="BOY"
                      checked={field.value === 'BOY'}
                      onChange={() => field.onChange('BOY')}
                    />
                    <span>{t.optionGenderBoy}</span>
                  </label>
                  <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 ${field.value === 'GIRL' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <input
                      type="radio"
                      className="sr-only"
                      value="GIRL"
                      checked={field.value === 'GIRL'}
                      onChange={() => field.onChange('GIRL')}
                    />
                    <span>{t.optionGenderGirl}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm font-medium text-destructive">{serverError}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? t.btnLoading : p.btnAddChild}
        </Button>
      </form>
    </Form>
  )
}
