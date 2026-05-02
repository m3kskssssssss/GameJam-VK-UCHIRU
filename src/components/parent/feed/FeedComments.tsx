'use client'
// Inline comment thread rendered directly inside a FeedPostCard.
// Always visible, optimistic-appends new entries on send.
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addComment } from '@/server/actions/feed'
import type { FeedCommentItem } from '@/server/actions/feed'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
})

interface FeedCommentsProps {
  postId: string
  initialComments: FeedCommentItem[]
  onCommentAdded?: () => void
}

export function FeedComments({
  postId,
  initialComments,
  onCommentAdded,
}: FeedCommentsProps) {
  const [comments, setComments] = useState<FeedCommentItem[]>(initialComments)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    const trimmed = body.trim()
    if (!trimmed || isPending) return

    const optimistic: FeedCommentItem = {
      id: `opt_${Date.now()}`,
      authorType: 'PARENT',
      authorId: '',
      authorName: '...',
      body: trimmed,
      createdAt: new Date(),
    }
    setComments((prev) => [...prev, optimistic])
    setBody('')
    onCommentAdded?.()

    startTransition(async () => {
      try {
        const created = await addComment({ postId, body: trimmed })
        setComments((prev) =>
          prev.map((c) => (c.id === optimistic.id ? created : c)),
        )
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
        toast.error(p.feed.commentError)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {comments.length > 0 && (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {dateFmt.format(c.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-foreground/90 whitespace-pre-wrap break-words">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={p.feed.commentPlaceholder}
          disabled={isPending}
          aria-label={p.feed.commentPlaceholder}
          className="h-9"
        />
        <Button
          onClick={handleSend}
          disabled={isPending || body.trim() === ''}
          size="sm"
        >
          {p.feed.btnSendComment}
        </Button>
      </div>
    </div>
  )
}
