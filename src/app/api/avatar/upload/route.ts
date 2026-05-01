// POST /api/avatar/upload — multipart avatar photo upload.
// Accessible by PARENT (for own avatar, child avatar, relative avatar)
// and RELATIVE (only for their own avatar when target=relative:<their id>).

import { prisma } from '@/lib/db'
import { requireParentOrRelative } from '@/server/auth/guards'
import { uploadAvatarPhoto, deleteBlob } from '@/lib/blob'
import { setParentAvatar, setChildAvatar, setRelativeAvatar } from '@/server/actions/avatars'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_MIME_PREFIX = 'image/'

// Matches:  'parent'  |  'child:<id>'  |  'relative:<id>'
const TARGET_RE = /^(parent|child:([\w-]+)|relative:([\w-]+))$/

export async function POST(request: Request): Promise<Response> {
  console.log('[avatar/upload] received POST')

  // --- Auth ---
  let viewer: Awaited<ReturnType<typeof requireParentOrRelative>>
  try {
    viewer = await requireParentOrRelative()
  } catch (err) {
    if (isNextInternalError(err)) {
      console.error('[avatar/upload] auth redirect (not signed in)')
      return Response.json({ error: 'NOT_AUTHORIZED_REDIRECT' }, { status: 401 })
    }
    console.error('[avatar/upload] auth error', err)
    return Response.json({ error: 'NOT_AUTHORIZED' }, { status: 401 })
  }
  console.log('[avatar/upload] authed viewer=', viewer.id, 'kind=', viewer.kind)

  // --- Parse form data ---
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const targetEntry = formData.get('target')
  const fileEntry = formData.get('file')

  // --- Validate target format ---
  if (typeof targetEntry !== 'string' || targetEntry.trim() === '') {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const target = targetEntry.trim()
  const match = TARGET_RE.exec(target)
  if (!match) {
    return Response.json({ error: 'INVALID_TARGET' }, { status: 400 })
  }

  // Parse kind + optional entity id from the regex groups.
  //   match[1] = full match ('parent' | 'child:<id>' | 'relative:<id>')
  //   match[2] = child id (if applicable)
  //   match[3] = relative id (if applicable)
  const targetKind = target === 'parent' ? 'parent' : target.startsWith('child:') ? 'child' : 'relative'
  const targetId = match[2] ?? match[3] ?? '' // only set for child/relative

  // --- Access control ---
  if (targetKind === 'parent') {
    if (viewer.kind !== 'parent') {
      return Response.json({ error: 'ACCESS_DENIED' }, { status: 403 })
    }
  } else if (targetKind === 'child') {
    if (viewer.kind !== 'parent') {
      return Response.json({ error: 'ACCESS_DENIED' }, { status: 403 })
    }
    // Ownership of childId is enforced by setChildAvatar → assertOwnsChild.
  } else {
    // targetKind === 'relative'
    if (viewer.kind === 'relative') {
      // Relative may only update their own avatar.
      if (targetId !== viewer.id) {
        return Response.json({ error: 'ACCESS_DENIED' }, { status: 403 })
      }
    }
    // parent: allowed; ownership is checked by setRelativeAvatar.
  }

  // --- Validate file ---
  if (!(fileEntry instanceof File)) {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  if (!fileEntry.type.startsWith(ALLOWED_MIME_PREFIX)) {
    return Response.json({ error: 'INVALID_FILE_TYPE' }, { status: 400 })
  }
  if (fileEntry.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'FILE_TOO_LARGE' }, { status: 400 })
  }

  // --- Upload ---
  console.log(
    '[avatar/upload] uploading',
    'targetKind=', targetKind,
    'targetId=', targetId || viewer.id,
    'bytes=', fileEntry.size,
    'type=', fileEntry.type,
  )
  const uploadId = targetKind === 'parent' ? viewer.id : targetId
  let uploadResult: { url: string; key: string }
  try {
    const buffer = Buffer.from(await fileEntry.arrayBuffer())
    uploadResult = await uploadAvatarPhoto(targetKind, uploadId, buffer, fileEntry.type)
    console.log('[avatar/upload] upload done', uploadResult.url)
  } catch (err) {
    console.error('[avatar/upload] upload failed', err)
    return Response.json({
      error: 'UPLOAD_FAILED',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }

  // --- Persist avatar URL via server action (or direct DB for relative self-update) ---
  try {
    if (targetKind === 'parent') {
      await setParentAvatar({ photoUrl: uploadResult.url, photoKey: uploadResult.key })
    } else if (targetKind === 'child') {
      await setChildAvatar({ childId: targetId, photoUrl: uploadResult.url, photoKey: uploadResult.key })
    } else if (viewer.kind === 'relative' && targetId === viewer.id) {
      // Relative updating their own avatar: setRelativeAvatar requires PARENT session,
      // so we do the write directly here with the same old-blob-cleanup pattern.
      const old = await prisma.relative.findUnique({
        where: { id: viewer.id },
        select: { avatarUrl: true },
      })
      if (old?.avatarUrl) {
        deleteBlob(old.avatarUrl).catch((err) => {
          console.error('[avatar/upload] deleteBlob old relative avatar failed:', err)
        })
      }
      await prisma.relative.update({
        where: { id: viewer.id },
        data: { avatarUrl: uploadResult.url, avatarKey: uploadResult.key },
      })
    } else {
      // parent updating a relative's avatar
      await setRelativeAvatar({ relativeId: targetId, photoUrl: uploadResult.url, photoKey: uploadResult.key })
    }
    console.log('[avatar/upload] DB updated for', target)
  } catch (err) {
    console.error('[avatar/upload] DB update failed', err)
    return Response.json({
      error: 'DB_ERROR',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }

  return Response.json({ url: uploadResult.url, key: uploadResult.key })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect Next.js internal redirect/notFound signals (they use a NEXT_* digest). */
function isNextInternalError(err: unknown): boolean {
  if (err === null || typeof err !== 'object') return false
  const digest = (err as Record<string, unknown>).digest
  return typeof digest === 'string' && digest.startsWith('NEXT_')
}
