// POST /api/grandparent/upload — multipart photo upload for grandparent tasks.
// This is an API route (not a server action) because it receives multipart/form-data.
// Security: CHILD role is verified; only children submit grandparent task photos.

import { requireChild } from '@/server/auth/guards'
import { getTask } from '@/server/content/grandparents'
import { uploadGrandparentPhoto } from '@/lib/blob'
import { submitGrandparentTask } from '@/server/actions/grandparent'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_MIME_PREFIX = 'image/'

export async function POST(request: Request): Promise<Response> {
  console.log('[grandparent/upload] received POST')

  // --- Auth ---
  // requireChild() calls redirect() on auth failure; in a route handler
  // redirect() throws a special error we must not swallow as a 500.
  // Only CHILD role may upload grandparent task photos.
  let child: Awaited<ReturnType<typeof requireChild>>
  try {
    child = await requireChild()
  } catch (err) {
    if (isNextInternalError(err)) {
      console.error('[grandparent/upload] auth redirect (not signed in as CHILD)')
      return Response.json({ error: 'NOT_AUTHORIZED_REDIRECT' }, { status: 401 })
    }
    console.error('[grandparent/upload] auth error', err)
    return Response.json({ error: 'NOT_AUTHORIZED' }, { status: 401 })
  }
  console.log('[grandparent/upload] authed child=', child.id)

  // --- Parse form data ---
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const taskKeyEntry = formData.get('taskKey')
  const fileEntry = formData.get('file')

  // --- Validate taskKey ---
  if (typeof taskKeyEntry !== 'string' || taskKeyEntry.trim() === '') {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const taskKey = taskKeyEntry.trim()

  const task = getTask(taskKey)
  if (!task) {
    console.error('[grandparent/upload] unknown taskKey=', taskKey)
    return Response.json({ error: 'INVALID_TASK_KEY' }, { status: 400 })
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

  // --- Upload to blob storage ---
  console.log(
    '[grandparent/upload] uploading',
    'child=', child.id,
    'taskKey=', taskKey,
    'bytes=', fileEntry.size,
    'type=', fileEntry.type,
  )
  let uploadResult: { url: string; key: string }
  try {
    const buffer = Buffer.from(await fileEntry.arrayBuffer())
    uploadResult = await uploadGrandparentPhoto(child.id, taskKey, buffer, fileEntry.type)
    console.log('[grandparent/upload] upload done', uploadResult.url)
  } catch (err) {
    console.error('[grandparent/upload] upload failed', err)
    return Response.json({
      error: 'UPLOAD_FAILED',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }

  // --- Submit task (write DB records + award rewards) ---
  let submitResult: Awaited<ReturnType<typeof submitGrandparentTask>>
  try {
    submitResult = await submitGrandparentTask({
      taskKey,
      photoUrl: uploadResult.url,
      photoKey: uploadResult.key,
    })
    console.log('[grandparent/upload] submit done completionId=', submitResult.completionId)
  } catch (err) {
    console.error('[grandparent/upload] submitGrandparentTask failed', err)
    return Response.json({
      error: 'SUBMIT_FAILED',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }

  return Response.json({
    url: uploadResult.url,
    key: uploadResult.key,
    coinsEarned: submitResult.coinsEarned,
    energyEarned: submitResult.energyEarned,
  })
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
