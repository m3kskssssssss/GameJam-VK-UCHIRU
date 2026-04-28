// Landing page — parent-facing marketing surface (Phase 0 placeholder)
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ru } from '@/i18n/ru'

const { landing } = ru

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 gap-8 bg-background text-foreground">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 text-center max-w-lg">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          {landing.title}
        </h1>
        <p className="text-lg text-foreground/60 max-w-[32rem] text-balance">
          {landing.subtitle}
        </p>
      </section>

      {/* CTA row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" variant="default">
          <Link href="/auth/login">{landing.ctaLogin}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/register">{landing.ctaRegister}</Link>
        </Button>
      </div>

      {/* Tagline footer */}
      <p className="text-sm text-foreground/60">{landing.tagline}</p>
    </main>
  )
}
