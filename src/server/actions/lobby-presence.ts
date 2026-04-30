'use server'
// Lightweight heartbeat-based presence for the /play/lobby visual world.
// Each child upserts their LobbyPresence row every ~300ms while inside the
// lobby. getLobbyPresence returns rows whose lastHeartbeatAt is within the
// stale threshold (≤8s) so disconnected players naturally drop off without
// any explicit leave call.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'

const PresenceInputSchema = z.object({
  x: z.number().finite(),
  z: z.number().finite(),
})

const STALE_MS = 8_000
const FIELD_HALF = 26 // generous clamp — visual lobby is ~50×50

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export interface LobbyPresenceEntry {
  childId: string
  displayName: string
  gender: 'BOY' | 'GIRL'
  x: number
  z: number
}

export async function heartbeatLobbyPresence(input: {
  x: number
  z: number
}): Promise<{ ok: true }> {
  const parsed = PresenceInputSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const child = await requireChild()
  const row = await prisma.child.findUnique({
    where: { id: child.id },
    select: { displayName: true, gender: true },
  })
  if (!row) throw new Error('CHILD_NOT_FOUND')

  const x = clamp(parsed.data.x, -FIELD_HALF, FIELD_HALF)
  const z = clamp(parsed.data.z, -FIELD_HALF, FIELD_HALF)

  await prisma.lobbyPresence.upsert({
    where: { childId: child.id },
    create: {
      childId: child.id,
      displayName: row.displayName,
      gender: row.gender,
      x,
      z,
      lastHeartbeatAt: new Date(),
    },
    update: {
      displayName: row.displayName,
      gender: row.gender,
      x,
      z,
      lastHeartbeatAt: new Date(),
    },
  })
  return { ok: true }
}

export async function getLobbyPresence(): Promise<LobbyPresenceEntry[]> {
  const me = await requireChild()
  const cutoff = new Date(Date.now() - STALE_MS)
  const rows = await prisma.lobbyPresence.findMany({
    where: { lastHeartbeatAt: { gt: cutoff } },
    select: { childId: true, displayName: true, gender: true, x: true, z: true },
  })
  // Drop "me" so the local 3D character doesn't double-render.
  return rows
    .filter((r) => r.childId !== me.id)
    .map((r) => ({
      childId: r.childId,
      displayName: r.displayName,
      gender: r.gender === 'GIRL' ? 'GIRL' : 'BOY',
      x: r.x,
      z: r.z,
    }))
}

export async function leaveLobbyPresence(): Promise<{ ok: true }> {
  const child = await requireChild()
  await prisma.lobbyPresence.deleteMany({ where: { childId: child.id } })
  return { ok: true }
}
