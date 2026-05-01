'use server'
// Activity feed: list posts, post detail, comments, likes.
// Accessible to both PARENT and RELATIVE roles via requireParentOrRelative().

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireParentOrRelative } from '@/server/auth/guards'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const ListFeedSchema = z.object({
  search: z.string().max(100).optional(),
  childId: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
  take: z.number().int().min(1).max(50).optional(),
})

const PostIdSchema = z.object({
  postId: z.string().min(1),
})

const AddCommentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().trim().min(1).max(500),
})

const ToggleLikeSchema = z.object({
  postId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type FeedPostListItem = {
  id: string
  childId: string
  childName: string
  childGender: 'BOY' | 'GIRL'
  childAvatarUrl: string | null
  kind: 'PE' | 'GRANDPARENT' | 'TASK'
  title: string
  photoUrl: string | null
  rewardCoins: number
  rewardEnergy: number
  createdAt: Date
  likesCount: number
  commentsCount: number
  isLikedByMe: boolean
}

export type FeedCommentItem = {
  id: string
  authorType: 'PARENT' | 'RELATIVE'
  authorId: string
  authorName: string
  body: string
  createdAt: Date
}

// ---------------------------------------------------------------------------
// listFeed
// ---------------------------------------------------------------------------

export async function listFeed(input: {
  search?: string
  childId?: string
  cursor?: string
  take?: number
}): Promise<{ posts: FeedPostListItem[]; nextCursor: string | null }> {
  const parsed = ListFeedSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const viewer = await requireParentOrRelative()

  const take = Math.min(parsed.data.take ?? 20, 50)
  const searchTerm = parsed.data.search?.toLowerCase().trim() ?? ''
  const { childId, cursor } = parsed.data

  const where = {
    parentId: viewer.parentId,
    ...(childId ? { childId } : {}),
    ...(searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            {
              child: {
                is: { displayName: { contains: searchTerm, mode: 'insensitive' as const } },
              },
            },
          ],
        }
      : {}),
  }

  const rows = await prisma.feedPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      child: { select: { id: true, displayName: true, gender: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const hasMore = rows.length > take
  const visibleRows = hasMore ? rows.slice(0, take) : rows

  // Batch-check which posts the viewer has already liked.
  const postIds = visibleRows.map((p) => p.id)
  const authorType = viewer.kind === 'parent' ? ('PARENT' as const) : ('RELATIVE' as const)

  const myLikes = await prisma.feedLike.findMany({
    where: { postId: { in: postIds }, authorType, authorId: viewer.id },
    select: { postId: true },
  })
  const likedSet = new Set(myLikes.map((l) => l.postId))

  const posts: FeedPostListItem[] = visibleRows.map((row) => ({
    id: row.id,
    childId: row.child.id,
    childName: row.child.displayName,
    childGender: row.child.gender,
    childAvatarUrl: row.child.avatarUrl,
    kind: row.kind as 'PE' | 'GRANDPARENT' | 'TASK',
    title: row.title,
    photoUrl: row.photoUrl,
    rewardCoins: row.rewardCoins,
    rewardEnergy: row.rewardEnergy,
    createdAt: row.createdAt,
    likesCount: row._count.likes,
    commentsCount: row._count.comments,
    isLikedByMe: likedSet.has(row.id),
  }))

  const nextCursor = hasMore ? visibleRows[visibleRows.length - 1].id : null

  return { posts, nextCursor }
}

// ---------------------------------------------------------------------------
// getPostDetail
// ---------------------------------------------------------------------------

export async function getPostDetail(input: {
  postId: string
}): Promise<{ post: FeedPostListItem; comments: FeedCommentItem[] }> {
  const parsed = PostIdSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const viewer = await requireParentOrRelative()

  const row = await prisma.feedPost.findUnique({
    where: { id: parsed.data.postId },
    include: {
      child: { select: { id: true, displayName: true, gender: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          authorType: true,
          authorId: true,
          authorName: true,
          body: true,
          createdAt: true,
        },
      },
    },
  })

  if (!row) throw new Error('NOT_FOUND')
  if (row.parentId !== viewer.parentId) throw new Error('ACCESS_DENIED')

  const authorType = viewer.kind === 'parent' ? ('PARENT' as const) : ('RELATIVE' as const)
  const myLike = await prisma.feedLike.findUnique({
    where: {
      postId_authorType_authorId: {
        postId: row.id,
        authorType,
        authorId: viewer.id,
      },
    },
    select: { id: true },
  })

  const post: FeedPostListItem = {
    id: row.id,
    childId: row.child.id,
    childName: row.child.displayName,
    childGender: row.child.gender,
    childAvatarUrl: row.child.avatarUrl,
    kind: row.kind as 'PE' | 'GRANDPARENT' | 'TASK',
    title: row.title,
    photoUrl: row.photoUrl,
    rewardCoins: row.rewardCoins,
    rewardEnergy: row.rewardEnergy,
    createdAt: row.createdAt,
    likesCount: row._count.likes,
    commentsCount: row._count.comments,
    isLikedByMe: myLike !== null,
  }

  // Reverse so oldest comments are first (chronological order for UI).
  const comments: FeedCommentItem[] = row.comments
    .slice()
    .reverse()
    .map((c) => ({
      id: c.id,
      authorType: c.authorType as 'PARENT' | 'RELATIVE',
      authorId: c.authorId,
      authorName: c.authorName,
      body: c.body,
      createdAt: c.createdAt,
    }))

  return { post, comments }
}

// ---------------------------------------------------------------------------
// addComment
// ---------------------------------------------------------------------------

export async function addComment(input: {
  postId: string
  body: string
}): Promise<FeedCommentItem> {
  const parsed = AddCommentSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const viewer = await requireParentOrRelative()

  const post = await prisma.feedPost.findUnique({
    where: { id: parsed.data.postId },
    select: { parentId: true },
  })
  if (!post) throw new Error('NOT_FOUND')
  if (post.parentId !== viewer.parentId) throw new Error('ACCESS_DENIED')

  const authorType = viewer.kind === 'parent' ? ('PARENT' as const) : ('RELATIVE' as const)

  const comment = await prisma.feedComment.create({
    data: {
      postId: parsed.data.postId,
      authorType,
      authorId: viewer.id,
      authorName: viewer.displayName,
      body: parsed.data.body,
    },
    select: {
      id: true,
      authorType: true,
      authorId: true,
      authorName: true,
      body: true,
      createdAt: true,
    },
  })

  return {
    id: comment.id,
    authorType: comment.authorType as 'PARENT' | 'RELATIVE',
    authorId: comment.authorId,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: comment.createdAt,
  }
}

// ---------------------------------------------------------------------------
// toggleLike
// ---------------------------------------------------------------------------

export async function toggleLike(input: {
  postId: string
}): Promise<{ liked: boolean; likesCount: number }> {
  const parsed = ToggleLikeSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')

  const viewer = await requireParentOrRelative()

  const post = await prisma.feedPost.findUnique({
    where: { id: parsed.data.postId },
    select: { parentId: true },
  })
  if (!post) throw new Error('NOT_FOUND')
  if (post.parentId !== viewer.parentId) throw new Error('ACCESS_DENIED')

  const authorType = viewer.kind === 'parent' ? ('PARENT' as const) : ('RELATIVE' as const)

  // Attempt to delete an existing like first.
  const deleted = await prisma.feedLike.deleteMany({
    where: { postId: parsed.data.postId, authorType, authorId: viewer.id },
  })

  let liked: boolean
  if (deleted.count > 0) {
    liked = false
  } else {
    // No existing like — create one. Catch P2002 for concurrent race.
    try {
      await prisma.feedLike.create({
        data: { postId: parsed.data.postId, authorType, authorId: viewer.id },
      })
      liked = true
    } catch (err) {
      // P2002 = unique constraint violation (race condition): treat as liked.
      const code = (err as { code?: string }).code
      if (code === 'P2002') {
        liked = true
      } else {
        throw err
      }
    }
  }

  const likesCount = await prisma.feedLike.count({
    where: { postId: parsed.data.postId },
  })

  return { liked, likesCount }
}

// ---------------------------------------------------------------------------
// attachPhotoToPost — internal helper (not a user-facing action)
// Called by API routes (e.g. /api/pe/upload) after a successful blob upload
// to retroactively attach the photo URL to an existing FeedPost row.
// ---------------------------------------------------------------------------

export async function attachPhotoToPost(
  postId: string,
  photoUrl: string,
  photoKey: string,
): Promise<void> {
  await prisma.feedPost.update({
    where: { id: postId },
    data: { photoUrl, photoKey },
  })
}
