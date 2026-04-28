// Parent dashboard — children list page.
// Server component: fetches children list and renders grid of ChildCard components.
import { listChildren } from '@/server/actions/children'
import { requireParent } from '@/server/auth/guards'
import { ChildCard } from '@/components/parent/ChildCard'
import { AddChildDialog } from '@/components/parent/AddChildDialog'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { prisma } from '@/lib/db'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

export default async function ParentPage() {
  const parent = await requireParent()

  // listChildren() returns ChildSummary[] without username — we need it for ChildCard.
  // Fetch summaries via the server action, then augment with usernames in one DB call.
  const summaries = await listChildren()

  // Fetch usernames for all children at once.
  const childIds = summaries.map((s) => s.id)
  const usernameRows =
    childIds.length > 0
      ? await prisma.child.findMany({
          where: { id: { in: childIds } },
          select: { id: true, username: true },
        })
      : []

  const usernameMap = new Map(usernameRows.map((r) => [r.id, r.username]))

  const children = summaries.map((s) => ({
    ...s,
    username: usernameMap.get(s.id) ?? '',
  }))

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-xl font-extrabold truncate">
            {p.greeting}, {parent.displayName}!
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <AddChildDialog />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-extrabold">{p.childrenTitle}</h2>

        {children.length === 0 ? (
          /* Empty state */
          <section className="flex flex-col items-center justify-center gap-6 py-20 text-center">
            <div className="text-6xl" aria-hidden="true">
              👦
            </div>
            <p className="text-lg text-muted-foreground max-w-xs">
              {p.noChildren}
            </p>
            <AddChildDialog triggerLabel={p.noChildrenCta} />
          </section>
        ) : (
          /* Children grid: 1 col < 640px, 2 cols ≥ 640px, 3 cols ≥ 1024px */
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-label={p.childrenTitle}
          >
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
