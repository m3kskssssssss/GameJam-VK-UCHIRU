'use client'
// AppShell — top header with nav (desktop inline, mobile hamburger Sheet).
// Used by /parent layout for both PARENT and RELATIVE viewers.
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

// ---------------------------------------------------------------------------
// Nav items configuration — filtered by viewerKind where needed
// ---------------------------------------------------------------------------

type NavItem = {
  label: string
  href: string
  roles: ('parent' | 'relative')[]
}

const NAV_ITEMS: NavItem[] = [
  { label: p.nav.children, href: '/parent', roles: ['parent'] },
  { label: p.nav.feed, href: '/parent/feed', roles: ['parent', 'relative'] },
  { label: p.nav.relatives, href: '/parent/relatives', roles: ['parent'] },
  { label: p.nav.profile, href: '/parent/profile', roles: ['parent', 'relative'] },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AppShellProps {
  viewerKind: 'parent' | 'relative'
  viewerName: string
  viewerAvatarUrl: string | null
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ---------------------------------------------------------------------------
// NavLink — a single navigation link with active styling
// ---------------------------------------------------------------------------

function NavLink({
  href,
  label,
  currentPath,
  onClick,
  inSheet = false,
}: {
  href: string
  label: string
  currentPath: string
  onClick?: () => void
  inSheet?: boolean
}) {
  // For /parent exactly match; for others prefix match
  const isActive =
    href === '/parent' ? currentPath === '/parent' : currentPath.startsWith(href)

  // Inside the mobile sheet we want a tile look (no underline). Desktop keeps
  // the underline-on-active styling unchanged.
  const className = inSheet
    ? [
        'block w-full text-base font-semibold transition-colors rounded-lg px-3 py-2.5',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:bg-muted',
      ].join(' ')
    : [
        'text-sm font-medium transition-colors px-1 py-0.5',
        isActive
          ? 'text-primary font-bold border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')

  return (
    <Link href={href} onClick={onClick} className={className}>
      {label}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

export function AppShell({
  viewerKind,
  viewerName,
  viewerAvatarUrl,
  children,
}: AppShellProps) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(viewerKind))

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <header
        className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border"
        style={{
          // PWA on iOS uses viewport-fit=cover + a translucent status bar, so
          // the page extends behind the Dynamic Island / notch. Push the
          // clickable row down by the safe-area inset (and inwards from the
          // sides for landscape) — the header background still tiles up to
          // the screen edge so nothing leaks through.
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Brand */}
          <span className="font-extrabold text-lg shrink-0">{p.nav.brandTitle}</span>

          {/* Desktop nav — hidden on mobile */}
          <nav
            aria-label="Основная навигация"
            className="hidden md:flex items-center gap-5 flex-1"
          >
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                currentPath={pathname}
              />
            ))}
          </nav>

          {/* Right side: avatar + logout */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <Avatar className="h-8 w-8 text-xs font-bold">
              {viewerAvatarUrl && (
                <AvatarImage src={viewerAvatarUrl} alt={viewerName} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-extrabold">
                {initials(viewerName)}
              </AvatarFallback>
            </Avatar>

            <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
              {viewerName}
            </span>

            <div className="hidden md:block">
              <LogoutButton />
            </div>

            {/* Hamburger — mobile only */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Открыть меню"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="top"
                className="rounded-b-2xl border-b shadow-xl flex flex-col gap-4 pb-5 px-5"
                style={{
                  // Match the header — start the sheet content below the
                  // Dynamic Island / notch when running as a PWA.
                  paddingTop:
                    'calc(env(safe-area-inset-top) + 1.5rem)',
                  paddingLeft:
                    'calc(env(safe-area-inset-left) + 1.25rem)',
                  paddingRight:
                    'calc(env(safe-area-inset-right) + 1.25rem)',
                }}
              >
                <SheetHeader className="pr-8">
                  <SheetTitle className="text-base">{p.nav.brandTitle}</SheetTitle>
                </SheetHeader>

                <nav
                  aria-label="Мобильная навигация"
                  className="flex flex-col gap-1"
                >
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      currentPath={pathname}
                      onClick={() => setSheetOpen(false)}
                      inSheet
                    />
                  ))}
                </nav>

                <div className="pt-1">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Page content */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
