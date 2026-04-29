'use client'
// Logout button — calls signOut server action and redirects to home
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/server/actions/auth-actions'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending ? t.btnLoading : t.btnLogout}
    </Button>
  )
}
