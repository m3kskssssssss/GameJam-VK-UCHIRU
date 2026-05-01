'use client'
// FeedPostCard — single post card in the activity feed.
// Handles optimistic like toggle and opens comment dialog.
import { useState, useTransition } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FeedCommentDialog } from '@/components/parent/feed/FeedCommentDialog'
import { toggleLike } from '@/server/actions/feed'
import type { FeedPostListItem } from '@/server/actions/feed'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const numFmt = new Intl.NumberFormat('ru-RU')
const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'short',
})

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

function kindLabel(kind: FeedPostListItem['kind']): string {
  if (kind === 'PE') return p.feed.kindPE
  if (kind === 'GRANDPARENT') return p.feed.kindGrandparent
  return p.feed.kindTask
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedPostCardProps {
  post: FeedPostListItem
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedPostCard({ post: initialPost }: FeedPostCardProps) {
  const [liked, setLiked] = useState(initialPost.isLikedByMe)
  const [likesCount, setLikesCount] = useState(initialPost.likesCount)
  const [commentOpen, setCommentOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleLike() {
    // Optimistic update
    const prevLiked = liked
    const prevCount = likesCount
    setLiked(!prevLiked)
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1)

    startTransition(async () => {
      try {
        const result = await toggleLike({ postId: initialPost.id })
        setLiked(result.liked)
        setLikesCount(result.likesCount)
      } catch {
        // Revert optimistic
        setLiked(prevLiked)
        setLikesCount(prevCount)
        toast.error(p.feed.likeError)
      }
    })
  }

  return (
    <article
      className="rounded-[var(--radius-card)] bg-card border border-border p-4 space-y-3"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header: child avatar + name + kind badge + date */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          {initialPost.childAvatarUrl && (
            <AvatarImage
              src={initialPost.childAvatarUrl}
              alt={initialPost.childName}
            />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-extrabold">
            {initials(initialPost.childName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{initialPost.childName}</span>
            <Badge variant="secondary" className="text-xs">
              {kindLabel(initialPost.kind)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {dateFmt.format(initialPost.createdAt)}
          </p>
        </div>
      </div>

      {/* Title */}
      <p className="font-medium text-sm leading-snug">{initialPost.title}</p>

      {/* Photo */}
      {initialPost.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={initialPost.photoUrl}
          alt={initialPost.title}
          className="w-full rounded-lg object-cover max-h-64"
        />
      )}

      {/* Reward chips */}
      {(initialPost.rewardCoins > 0 || initialPost.rewardEnergy > 0) && (
        <div className="flex flex-wrap gap-2">
          {initialPost.rewardCoins > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
              <span aria-hidden="true">🪙</span>
              {numFmt.format(initialPost.rewardCoins)} {p.feed.rewardCoins}
            </span>
          )}
          {initialPost.rewardEnergy > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
              <span aria-hidden="true">⚡</span>
              {numFmt.format(initialPost.rewardEnergy)} {p.feed.rewardEnergy}
            </span>
          )}
        </div>
      )}

      {/* Actions: like + comments */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2"
          onClick={handleLike}
          disabled={isPending}
          aria-label={p.feed.likeBtn}
          aria-pressed={liked}
        >
          <Heart
            className={['h-4 w-4', liked ? 'fill-red-500 text-red-500' : ''].join(' ')}
            aria-hidden="true"
          />
          <span className="text-xs tabular-nums">{numFmt.format(likesCount)}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2"
          onClick={() => setCommentOpen(true)}
          aria-label={p.feed.commentBtn}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs tabular-nums">
            {numFmt.format(initialPost.commentsCount)}
          </span>
        </Button>
      </div>

      {/* Comment dialog — lazy-mounted */}
      {commentOpen && (
        <FeedCommentDialog
          postId={initialPost.id}
          open={commentOpen}
          onClose={() => setCommentOpen(false)}
          initialCommentsCount={initialPost.commentsCount}
        />
      )}
    </article>
  )
}
