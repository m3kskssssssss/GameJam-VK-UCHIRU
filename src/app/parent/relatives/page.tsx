// Relatives management page — PARENT only.
// Lists all relatives with management cards; includes AddRelativeDialog.
import { requireParent } from '@/server/auth/guards'
import { listRelatives } from '@/server/actions/relatives'
import { RelativeCard } from '@/components/parent/relatives/RelativeCard'
import { AddRelativeDialog } from '@/components/parent/relatives/AddRelativeDialog'
import { ru } from '@/i18n/ru'

const { parent: p } = ru
const r = p.relatives

export default async function RelativesPage() {
  // PARENT guard (middleware also enforces this, but belt-and-suspenders)
  await requireParent()

  const relatives = await listRelatives()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold">{r.title}</h1>
        <AddRelativeDialog />
      </div>

      {relatives.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-6 py-20 text-center">
          <div className="text-5xl" aria-hidden="true">👩‍👧</div>
          <p className="text-lg text-muted-foreground max-w-xs">{r.empty}</p>
          <AddRelativeDialog triggerLabel={r.btnAdd} />
        </section>
      ) : (
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-label={r.title}
        >
          {relatives.map((relative) => (
            <RelativeCard key={relative.id} relative={relative} />
          ))}
        </section>
      )}
    </div>
  )
}
