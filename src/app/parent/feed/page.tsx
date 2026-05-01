// Feed page — activity stream for PARENT and RELATIVE viewers.
// Server component: fetches first page server-side; client FeedList handles rest.
import { requireParentOrRelative } from '@/server/auth/guards'
import { listFeed } from '@/server/actions/feed'
import { prisma } from '@/lib/db'
import { FeedList } from '@/components/parent/feed/FeedList'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

export default async function FeedPage() {
  const viewer = await requireParentOrRelative()

  // First page — server-side
  const { posts, nextCursor } = await listFeed({})

  // Fetch children list for the filter (only relevant to PARENT, but safe for both)
  const childrenList = await prisma.child.findMany({
    where: { parentId: viewer.parentId },
    select: { id: true, displayName: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold">{p.feed.title}</h1>

      <FeedList
        initialPosts={posts}
        initialCursor={nextCursor}
        childrenList={childrenList}
      />
    </div>
  )
}
