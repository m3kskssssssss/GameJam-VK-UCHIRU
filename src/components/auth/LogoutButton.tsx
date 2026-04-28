'use client'
// Logout button — calls signOut server action and redirects to home
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/server/auth/index'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await signOut({ redirectTo: '/' })
    })
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending ? t.btnLoading : t.btnLogout}
    </Button>
  )
}
