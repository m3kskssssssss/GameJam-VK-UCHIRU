// Shared card wrapper for auth pages (login / register).
import Link from 'next/link'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

interface AuthCardProps {
  title: string
  children: React.ReactNode
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div
        className="w-full max-w-md rounded-[var(--radius-card)] bg-card border border-border p-8"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h1 className="text-2xl font-extrabold text-foreground mb-6">{title}</h1>
        {children}
      </div>
      <Link
        href="/"
        className="mt-6 text-sm text-foreground/60 hover:text-foreground transition-colors"
      >
        {t.linkToHome}
      </Link>
    </main>
  )
}
