// Helper for uploading a grandparent task photo.
// POSTs to /api/grandparent/upload (implemented in Phase E).

export async function submitGrandparentPhoto(taskKey: string, file: File): Promise<void> {
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
}
