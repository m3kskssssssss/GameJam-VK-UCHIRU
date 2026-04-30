'use server'
// Lightweight heartbeat-based presence for the /play/lobby visual world.
// Each child upserts their LobbyPresence row every ~400ms while inside the
// lobby. Heartbeats include world-space velocity, facing yaw, and movement
// flags so remote clients can extrapolate between polls and play the right
// animation. getLobbyPresence returns rows whose lastHeartbeatAt is within
// the stale threshold (≤8s) so disconnected players naturally drop off.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'

const PresenceInputSchema = z.object({
  x: z.number().finite(),
  z: z.number().finite(),
  yaw: z.number().finite(),
  vx: z.number().finite(),
  vz: z.number().finite(),
  isRunning: z.boolean(),
  isJumping: z.boolean(),
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
  yaw: number
  vx: number
  vz: number
  isRunning: boolean
  isJumping: boolean
  /** Server-stamped timestamp at the moment the row was last updated.
   *  Clients use it to predict the position forward in time. */
  updatedAtMs: number
}

export async function heartbeatLobbyPresence(input: {
  x: number
  z: number
  yaw: number
  vx: number
  vz: number
  isRunning: boolean
  isJumping: boolean
}): Promise<{ ok: true; serverTimeMs: number }> {
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
  const { yaw, vx, vz, isRunning, isJumping } = parsed.data
  const now = new Date()

  await prisma.lobbyPresence.upsert({
    where: { childId: child.id },
    create: {
      childId: child.id,
      displayName: row.displayName,
      gender: row.gender,
      x,
      z,
      yaw,
      vx,
      vz,
      isRunning,
      isJumping,
      lastHeartbeatAt: now,
    },
    update: {
      displayName: row.displayName,
      gender: row.gender,
      x,
      z,
      yaw,
      vx,
      vz,
      isRunning,
      isJumping,
      lastHeartbeatAt: now,
    },
  })
  return { ok: true, serverTimeMs: now.getTime() }
}

export async function getLobbyPresence(): Promise<{
  serverTimeMs: number
  entries: LobbyPresenceEntry[]
}> {
  const me = await requireChild()
  const cutoff = new Date(Date.now() - STALE_MS)
  const rows = await prisma.lobbyPresence.findMany({
    where: { lastHeartbeatAt: { gt: cutoff } },
    select: {
      childId: true,
      displayName: true,
      gender: true,
      x: true,
      z: true,
      yaw: true,
      vx: true,
      vz: true,
      isRunning: true,
      isJumping: true,
      lastHeartbeatAt: true,
    },
  })
  const serverTimeMs = Date.now()
  const entries: LobbyPresenceEntry[] = rows
    .filter((r) => r.childId !== me.id)
    .map((r) => ({
      childId: r.childId,
      displayName: r.displayName,
      gender: r.gender === 'GIRL' ? 'GIRL' : 'BOY',
      x: r.x,
      z: r.z,
      yaw: r.yaw,
      vx: r.vx,
      vz: r.vz,
      isRunning: r.isRunning,
      isJumping: r.isJumping,
      updatedAtMs: r.lastHeartbeatAt.getTime(),
    }))
  return { serverTimeMs, entries }
}

export async function leaveLobbyPresence(): Promise<{ ok: true }> {
  const child = await requireChild()
  await prisma.lobbyPresence.deleteMany({ where: { childId: child.id } })
  return { ok: true }
}
