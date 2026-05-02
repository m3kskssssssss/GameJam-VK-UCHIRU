// Parent registration page
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

export const metadata: Metadata = {
  title: 'Регистрация — Деревня Знаний',
}

export default function RegisterPage() {
  return (
    <AuthCard title={t.registerTitle}>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-foreground/60">
        <Link
          href="/auth/login"
          className="text-primary hover:underline font-semibold"
        >
          {t.linkToLogin}
        </Link>
      </p>
    </AuthCard>
  )
}
