'use client'
// Child login form — username + password
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { loginAction, loginChildSchema } from '@/server/actions/auth'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

type FormValues = z.infer<typeof loginChildSchema>

export function ChildLoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(loginChildSchema),
    defaultValues: { username: '', password: '' },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await loginAction({
        role: 'child',
        identifier: values.username,
        password: values.password,
      })
      if (result && !result.ok) {
        setServerError(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.labelUsername}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.placeholderUsername}
                  autoComplete="username"
                  autoCapitalize="none"
                  {...field}
                />
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
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm font-medium text-destructive">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t.btnLoading : t.btnLogin}
        </Button>
      </form>
    </Form>
  )
}
