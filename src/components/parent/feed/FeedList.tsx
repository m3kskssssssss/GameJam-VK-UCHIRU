'use client'
// FeedList — manages feed state, infinite scroll, search and child filtering.
// Receives initial posts from the server; subsequent pages loaded client-side.
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { FeedPostCard } from '@/components/parent/feed/FeedPostCard'
import { FeedFilters } from '@/components/parent/feed/FeedFilters'
import { listFeed } from '@/server/actions/feed'
import type { FeedPostListItem } from '@/server/actions/feed'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

// ---------------------------------------------------------------------------
// Skeleton placeholder for loading state
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div
      className="rounded-[var(--radius-card)] bg-card border border-border p-4 space-y-3 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-2 w-16 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-3/4 rounded bg-muted" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedListProps {
  initialPosts: FeedPostListItem[]
  initialCursor: string | null
  childrenList: { id: string; displayName: string }[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedList({
  initialPosts,
  initialCursor,
  childrenList,
}: FeedListProps) {
  const [posts, setPosts] = useState<FeedPostListItem[]>(initialPosts)
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor)
  const [search, setSearch] = useState<string>('')
  const [childId, setChildId] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Guard against double-fetching (IntersectionObserver fires twice sometimes)
  const fetchingRef = useRef(false)

  // ---------------------------------------------------------------------------
  // Reset + refetch when filters change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setPosts([])
    setNextCursor(undefined as unknown as string | null)
    fetchingRef.current = false

    startTransition(async () => {
      try {
        const result = await listFeed({ search: search || undefined, childId })
        setPosts(result.posts)
        setNextCursor(result.nextCursor)
      } catch {
        // silently fail; user can retry by scrolling
      }
    })
  }, [search, childId])

  // ---------------------------------------------------------------------------
  // Load more
  // ---------------------------------------------------------------------------

  const loadMore = useCallback(() => {
    if (fetchingRef.current || nextCursor === null) return
    fetchingRef.current = true

    startTransition(async () => {
      try {
        const result = await listFeed({
          search: search || undefined,
          childId,
          cursor: nextCursor ?? undefined,
        })
        setPosts((prev) => [...prev, ...result.posts])
        setNextCursor(result.nextCursor)
      } catch {
        // silently fail
      } finally {
        fetchingRef.current = false
      }
    })
  }, [nextCursor, search, childId])

  // ---------------------------------------------------------------------------
  // IntersectionObserver for infinite scroll
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleChildChange = useCallback((id: string | undefined) => {
    setChildId(id)
  }, [])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      <FeedFilters
        childrenList={childrenList}
        onSearchChange={handleSearchChange}
        onChildChange={handleChildChange}
      />

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 && !isPending && (
          <p className="text-center text-muted-foreground py-12">
            {p.feed.empty}
          </p>
        )}
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}

        {/* Loading skeletons */}
        {isPending && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}
      </div>

      {/* Sentinel div for IntersectionObserver */}
      {nextCursor !== null && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}
    </div>
  )
}
