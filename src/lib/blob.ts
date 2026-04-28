// Server-only helper for uploading PE photos.
// In production (BLOB_READ_WRITE_TOKEN set) → Vercel Blob with public access.
// In local dev (token absent) → writes to public/uploads/pe/ on disk.
// Photos are secured by URL secrecy (hard-to-guess suffix) + parent-only UI.

import path from 'path'
import fs from 'fs/promises'

export type BlobUploadResult = {
  url: string
  key: string
}

export async function uploadPEPhoto(
  sessionId: string,
  slot: '10s' | '60s',
  file: Buffer,
  mimeType: string,
): Promise<BlobUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    // Production: use Vercel Blob.
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
