// Server-only helper for uploading photos and blobs.
// In production / Vercel (BLOB_READ_WRITE_TOKEN set) → Vercel Blob with public access.
// In local dev (token absent + writable filesystem) → writes to public/uploads/.
// Photos are secured by URL secrecy (hard-to-guess suffix) + parent-only UI.

import path from 'path'
import fs from 'fs/promises'

export type BlobUploadResult = {
  url: string
  key: string
}

// Vercel sets `VERCEL=1` and `VERCEL_ENV` for both production and preview
// deployments. The local FS is read-only there — only `/tmp` is writable
// and even that's not exposed over HTTP, so we MUST use Vercel Blob.
function isServerless(): boolean {
  return Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
}

// Strips any char that isn't safe in a filesystem path segment.
function sanitizeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export async function uploadPEPhoto(
  sessionId: string,
  slot: '10s' | '60s',
  file: Buffer,
  mimeType: string,
): Promise<BlobUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    // Dynamic import avoids bundling the Vercel Blob SDK in edge runtimes
    // that don't need it during local dev.
    const { put } = await import('@vercel/blob')

    // addRandomSuffix makes the URL hard to guess — primary security layer
    // since the blobs are public but parents are the only ones with the UI.
    const result = await put(
      `pe/${sessionId}/${slot}.jpg`,
      file,
      {
        access: 'public',
        contentType: mimeType,
        token,
        addRandomSuffix: true,
      },
    )

    return { url: result.url, key: result.pathname }
  }

  // Refuse the disk fallback on serverless. Filesystem is read-only there
  // (only /tmp is writable, and that's not exposed over HTTP) so writing
  // into public/ throws ENOENT and the photo is lost. Surface a clear
  // error instead — the operator needs to create a Vercel Blob store and
  // link BLOB_READ_WRITE_TOKEN to this project's environment variables.
  if (isServerless()) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set in the deployment environment. ' +
        'Create a Vercel Blob store at https://vercel.com/dashboard/stores, ' +
        'connect it to this project, then redeploy. PE photos cannot be ' +
        'persisted on serverless without it.',
    )
  }

  // Local dev fallback: write to public/uploads/pe/<sessionId>/<slot>.jpg
  const dir = path.join(process.cwd(), 'public', 'uploads', 'pe', sessionId)
  await fs.mkdir(dir, { recursive: true })

  const filename = `${slot}.jpg`
  await fs.writeFile(path.join(dir, filename), file)

  return {
    url: `/uploads/pe/${sessionId}/${filename}`,
    key: `pe/${sessionId}/${filename}`,
  }
}

export async function uploadGrandparentPhoto(
  childId: string,
  taskKey: string,
  file: Buffer,
  mimeType: string,
): Promise<BlobUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    const { put } = await import('@vercel/blob')

    const result = await put(
      `pe-photos/grandparent/${childId}/${taskKey}.jpg`,
      file,
      {
        access: 'public',
        contentType: mimeType,
        token,
        addRandomSuffix: true,
      },
    )

    return { url: result.url, key: result.pathname }
  }

  if (isServerless()) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. Cannot store grandparent photo on serverless.',
    )
  }

  const safeChild = sanitizeSegment(childId)
  const safeTask = sanitizeSegment(taskKey)
  const dir = path.join(process.cwd(), 'public', 'uploads', 'grandparent', safeChild)
  await fs.mkdir(dir, { recursive: true })

  const filename = `${safeTask}.jpg`
  await fs.writeFile(path.join(dir, filename), file)

  return {
    url: `/uploads/grandparent/${safeChild}/${filename}`,
    key: `pe-photos/grandparent/${safeChild}/${filename}`,
  }
}

export async function uploadAvatarPhoto(
  kind: 'parent' | 'child' | 'relative',
  id: string,
  file: Buffer,
  mimeType: string,
): Promise<BlobUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    const { put } = await import('@vercel/blob')

    const result = await put(
      `avatars/${kind}/${id}.jpg`,
      file,
      {
        access: 'public',
        contentType: mimeType,
        token,
        addRandomSuffix: true,
      },
    )

    return { url: result.url, key: result.pathname }
  }

  if (isServerless()) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. Cannot store avatar on serverless.',
    )
  }

  const safeId = sanitizeSegment(id)
  const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars', kind)
  await fs.mkdir(dir, { recursive: true })

  const filename = `${safeId}.jpg`
  await fs.writeFile(path.join(dir, filename), file)

  return {
    url: `/uploads/avatars/${kind}/${filename}`,
    key: `avatars/${kind}/${filename}`,
  }
}

// Deletes a blob. Accepts the full blob URL (as returned by BlobUploadResult.url).
// Silent fail — a stale old avatar URL is never worth crashing over.
export async function deleteBlob(urlOrKey: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    try {
      // `del` from @vercel/blob accepts the full public URL, not the pathname.
      // Callers must pass BlobUploadResult.url (not .key) for production blobs.
      const { del } = await import('@vercel/blob')
      await del(urlOrKey, { token })
    } catch (err) {
      console.error('[blob] deleteBlob failed:', err)
    }
    return
  }

  // Local dev: urlOrKey is the local path like /uploads/avatars/child/abc.jpg
  if (urlOrKey.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', urlOrKey.slice(1))
    try {
      await fs.unlink(filePath)
    } catch (err) {
      // Ignore already-deleted files; log anything unexpected.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[blob] deleteBlob local unlink failed:', err)
      }
    }
    return
  }

  // No token + not a local path — nothing we can do safely.
  console.warn('[blob] deleteBlob: no token and URL is not a local /uploads/ path; skipping:', urlOrKey)
}
