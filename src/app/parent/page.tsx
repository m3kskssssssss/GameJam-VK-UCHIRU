// Parent dashboard — children list page.
// Server component: fetches children list and renders grid of ChildCard components.
// The outer header/nav is handled by AppShell in layout.tsx.
import { listChildren } from '@/server/actions/children'
import { requireParent } from '@/server/auth/guards'
import { ChildCard } from '@/components/parent/ChildCard'
import { AddChildDialog } from '@/components/parent/AddChildDialog'
import { prisma } from '@/lib/db'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

export default async function ParentPage() {
  const parent = await requireParent()

  const summaries = await listChildren()

  // Fetch usernames and avatarUrls for all children at once.
  const childIds = summaries.map((s) => s.id)
  const childRows =
    childIds.length > 0
      ? await prisma.child.findMany({
          where: { id: { in: childIds } },
          select: { id: true, username: true, avatarUrl: true },
        })
      : []

  const childRowMap = new Map(childRows.map((r) => [r.id, r]))

  const children = summaries.map((s) => ({
    ...s,
    username: childRowMap.get(s.id)?.username ?? '',
    avatarUrl: childRowMap.get(s.id)?.avatarUrl ?? null,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page heading row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">{p.greeting}, {parent.displayName}!</p>
          <h1 className="text-2xl font-extrabold">{p.childrenTitle}</h1>
        </div>
        <AddChildDialog />
      </div>

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
  )
}
