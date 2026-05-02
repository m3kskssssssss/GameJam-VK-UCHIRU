// Helper for uploading a grandparent task photo.
// POSTs to /api/grandparent/upload (implemented in Phase E).

export interface GrandparentSubmitResult {
  url: string
  key: string
  coinsEarned: number
  energyEarned: number
}

export async function submitGrandparentPhoto(
  taskKey: string,
  file: File,
): Promise<GrandparentSubmitResult> {
  const body = new FormData()
  body.append('taskKey', taskKey)
  body.append('file', file)

  const res = await fetch('/api/grandparent/upload', {
    method: 'POST',
    body,
  })

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`)
  }

  const data = (await res.json()) as Partial<GrandparentSubmitResult>
  return {
    url: data.url ?? '',
    key: data.key ?? '',
    coinsEarned: typeof data.coinsEarned === 'number' ? data.coinsEarned : 0,
    energyEarned: typeof data.energyEarned === 'number' ? data.energyEarned : 0,
  }
}
