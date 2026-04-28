// POST /api/pe/upload — multipart photo upload for PE sessions.
// This is an API route (not a server action) because it receives multipart/form-data.
// Security: CHILD role + session ownership are verified before any write.

import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import { uploadPEPhoto } from '@/lib/blob'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_SLOTS = new Set(['10s', '60s'])
const ALLOWED_MIME_PREFIX = 'image/'

export async function POST(request: Request): Promise<Response> {
  // --- Auth ---
  // requireChild() calls redirect() on auth failure; in a route handler
  // redirect() throws a special error we must not swallow as a 500.
  let child: Awaited<ReturnType<typeof requireChild>>
  try {
    child = await requireChild()
  } catch (err) {
    // Re-throw Next.js redirect/notFound signals so the framework handles them.
    if (isNextInternalError(err)) throw err
    return Response.json({ error: 'NOT_AUTHORIZED' }, { status: 401 })
  }

  // --- Parse form data ---
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const sessionId = formData.get('sessionId')
  const slot = formData.get('slot')
  const fileEntry = formData.get('file')

  // --- Validate inputs ---
  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  if (typeof slot !== 'string' || !ALLOWED_SLOTS.has(slot)) {
    return Response.json({ error: 'INVALID_SLOT' }, { status: 400 })
  }
  if (!(fileEntry instanceof File)) {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  if (!fileEntry.type.startsWith(ALLOWED_MIME_PREFIX)) {
    return Response.json({ error: 'INVALID_FILE_TYPE' }, { status: 400 })
  }
  if (fileEntry.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'FILE_TOO_LARGE' }, { status: 400 })
  }

  // --- Ownership: session must belong to this child ---
  const session = await prisma.pESession.findUnique({
    where: { id: sessionId.trim() },
    select: { id: true, childId: true, completed: true },
  })
  if (!session) {
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  if (session.childId !== child.id) {
    return Response.json({ error: 'ACCESS_DENIED' }, { status: 403 })
  }
  if (session.completed) {
    return Response.json({ error: 'SESSION_COMPLETED' }, { status: 409 })
  }

  // --- Upload ---
  let uploadResult: { url: string; key: string }
  try {
    const buffer = Buffer.from(await fileEntry.arrayBuffer())
    uploadResult = await uploadPEPhoto(
      session.id,
      slot as '10s' | '60s',
      buffer,
      fileEntry.type,
    )
  } catch (err) {
    console.error('[pe/upload] upload failed', err)
    return Response.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
  }

  // --- Persist URL/key on the PESession ---
  try {
    const updateData =
      slot === '10s'
        ? { photo10sUrl: uploadResult.url, photo10sKey: uploadResult.key }
        : { photo60sUrl: uploadResult.url, photo60sKey: uploadResult.key }

    await prisma.pESession.update({
      where: { id: session.id },
      data: updateData,
    })
  } catch (err) {
    console.error('[pe/upload] DB update failed', err)
    return Response.json({ error: 'DB_ERROR' }, { status: 500 })
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
