// Login page — parent and child tabs
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginTabs } from '@/components/auth/LoginTabs'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

export const metadata: Metadata = {
  title: 'Вход — Деревня Знаний',
}

export default function LoginPage() {
  return (
    <AuthCard title={t.loginTitle}>
      <LoginTabs />
      <p className="mt-4 text-center text-sm text-foreground/60">
        <Link
          href="/auth/register"
          className="text-primary hover:underline font-semibold"
        >
          {t.linkToRegister}
        </Link>
      </p>
    </AuthCard>
  )
}
