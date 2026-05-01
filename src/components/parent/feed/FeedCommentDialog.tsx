'use client'
// FeedCommentDialog — Dialog (Sheet on narrow) for post comments.
// Fetches comments on open; optimistic-appends new ones.
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getPostDetail, addComment } from '@/server/actions/feed'
import type { FeedCommentItem } from '@/server/actions/feed'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'short',
})

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedCommentDialogProps {
  postId: string
  open: boolean
  onClose: () => void
  initialCommentsCount: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedCommentDialog({
  postId,
  open,
  onClose,
  initialCommentsCount: _initialCount,
}: FeedCommentDialogProps) {
  const [comments, setComments] = useState<FeedCommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch on open
  useEffect(() => {
    if (!open) return
    setLoading(true)
    getPostDetail({ postId })
      .then(({ comments: fetched }) => setComments(fetched))
      .catch(() => toast.error(p.feed.commentError))
      .finally(() => setLoading(false))
  }, [open, postId])

  // Scroll to bottom when comments change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  function handleSend() {
    const trimmed = body.trim()
    if (!trimmed) return

    // Optimistic append with a temporary id
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

    startTransition(async () => {
      try {
        const created = await addComment({ postId, body: trimmed })
        // Replace optimistic item with real one
        setComments((prev) =>
          prev.map((c) => (c.id === optimistic.id ? created : c)),
        )
      } catch {
        // Revert optimistic
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[80dvh]">
        <DialogHeader>
          <DialogTitle>{p.feed.commentsDialogTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2 overflow-y-auto max-h-[50dvh]">
          {loading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {p.feed.loading}
            </p>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {p.feed.noComments}
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="py-2 border-b border-border last:border-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {dateFmt.format(c.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-0.5">{c.body}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Comment input */}
        <div className="flex gap-2 pt-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={p.feed.commentPlaceholder}
            disabled={isPending}
            aria-label={p.feed.commentPlaceholder}
          />
          <Button
            onClick={handleSend}
            disabled={isPending || body.trim() === ''}
            size="sm"
          >
            {p.feed.btnSendComment}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
