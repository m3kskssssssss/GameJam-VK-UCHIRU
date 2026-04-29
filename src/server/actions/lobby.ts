'use server'
// Lobby mini-game server actions — 3D coin-collection variant (60 s rounds).
// Players move continuously in the world; coins spawn at integer grid cells.
// Walking within COLLECT_RADIUS of an unclaimed coin claims it for the player.

import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import {
  GRID_W, GRID_H, FIELD_HALF_W, FIELD_HALF_D,
  COLLECT_RADIUS_SQ, ROUND_DURATION_MS, TARGET_ACTIVE_TILES,
  SPAWN_INTERVAL_MS, POSITION_THROTTLE_MS, MAX_PLAYERS, PLACE_COINS,
  MatchIdSchema, PositionSchema, cellToWorld,
  _spawnTiles, _finalizeMatch, occupiedSet, loadMatchWithTiles,
  type MatchState, type PlayerState, type TileState, type LeaderboardEntry,
} from '@/server/actions/lobby-helpers'

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

async function assertMembership(matchId: string, childId: string): Promise<void> {
  const player = await prisma.lobbyPlayer.findUnique({
    where: { matchId_childId: { matchId, childId } },
    select: { id: true },
  })
  if (!player) throw new Error('NOT_AUTHORIZED')
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

// ---------------------------------------------------------------------------
// joinOrCreateMatch
// ---------------------------------------------------------------------------

export async function joinOrCreateMatch(): Promise<{ matchId: string }> {
  const child = await requireChild()
  const { id: childId, displayName } = child

  const existing = await prisma.lobbyPlayer.findFirst({
    where: { childId, match: { status: { in: ['WAITING', 'ACTIVE'] } } },
    select: { matchId: true },
  })
  if (existing) return { matchId: existing.matchId }

  // Random spawn somewhere in the field, away from the absolute centre.
  const startX = (Math.random() - 0.5) * (GRID_W - 4)
  const startY = (Math.random() - 0.5) * (GRID_H - 4)

  const openMatch = await prisma.lobbyMatch.findFirst({
    where: { status: 'WAITING' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, _count: { select: { players: true } } },
  })

  if (openMatch && openMatch._count.players < MAX_PLAYERS) {
    await prisma.lobbyPlayer.create({
      data: { matchId: openMatch.id, childId, displayName, x: startX, y: startY },
    })
    return { matchId: openMatch.id }
  }

  const newMatch = await prisma.lobbyMatch.create({
    data: {
      status: 'WAITING',
      players: { create: { childId, displayName, x: startX, y: startY } },
    },
    select: { id: true },
  })
  return { matchId: newMatch.id }
}

// ---------------------------------------------------------------------------
// startMatch
// ---------------------------------------------------------------------------

export async function startMatch(input: { matchId: string }): Promise<void> {
  const { matchId } = MatchIdSchema.parse(input)
  const child = await requireChild()
  await assertMembership(matchId, child.id)

  const match = await prisma.lobbyMatch.findUniqueOrThrow({
    where: { id: matchId },
    select: { status: true },
  })

  if (match.status === 'FINISHED') throw new Error('ROUND_FINISHED')
  if (match.status === 'ACTIVE') return

  const now = new Date()
  const endsAt = new Date(now.getTime() + ROUND_DURATION_MS)

  await prisma.lobbyMatch.update({
    where: { id: matchId },
    data: { status: 'ACTIVE', startedAt: now, endsAt, lastSpawnAt: now },
  })

  // Initial spawn — coin coords are integer cells; players are at continuous
  // positions, so they don't conflict with cells.
  await _spawnTiles(matchId, TARGET_ACTIVE_TILES, occupiedSet([]))
}

// ---------------------------------------------------------------------------
// setPlayerPosition — move + collect any coins within COLLECT_RADIUS
// ---------------------------------------------------------------------------

export async function setPlayerPosition(input: {
  matchId: string
  x: number
  y: number
}): Promise<{ ok: boolean; collectedIds: string[]; newScore: number }> {
  const parsed = PositionSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const { matchId, x, y } = parsed.data

  const child = await requireChild()
  const childId = child.id

  const match = await prisma.lobbyMatch.findUnique({
    where: { id: matchId },
    select: { status: true, endsAt: true },
  })
  if (!match || match.status !== 'ACTIVE') {
    return { ok: false, collectedIds: [], newScore: 0 }
  }

  const now = new Date()
  if (match.endsAt && now > match.endsAt) {
    await _finalizeMatch(matchId)
    return { ok: false, collectedIds: [], newScore: 0 }
  }

  const player = await prisma.lobbyPlayer.findUnique({
    where: { matchId_childId: { matchId, childId } },
    select: { lastMoveAt: true, score: true },
  })
  if (!player) throw new Error('NOT_AUTHORIZED')

  // Throttle position writes — protects DB from spammy clients.
  if (now.getTime() - player.lastMoveAt.getTime() < POSITION_THROTTLE_MS) {
    return { ok: true, collectedIds: [], newScore: player.score }
  }

  const clampedX = clamp(x, -FIELD_HALF_W + 0.4, FIELD_HALF_W - 0.4)
  const clampedZ = clamp(y, -FIELD_HALF_D + 0.4, FIELD_HALF_D - 0.4)

  // Find candidate coins near the new position.
  const candidates = await prisma.lobbyTile.findMany({
    where: { matchId, stompedById: null },
    select: { id: true, x: true, y: true },
  })

  const within: string[] = []
  for (const c of candidates) {
    const w = cellToWorld(c.x, c.y)
    const dx = clampedX - w.x
    const dz = clampedZ - w.z
    if (dx * dx + dz * dz < COLLECT_RADIUS_SQ) within.push(c.id)
  }

  // Atomically: claim the coins (only those still null), update player.
  const result = await prisma.$transaction(async (tx) => {
    let claimed = 0
    if (within.length > 0) {
      const claim = await tx.lobbyTile.updateMany({
        where: { id: { in: within }, stompedById: null },
        data: { stompedById: childId, stompedAt: now },
      })
      claimed = claim.count
    }
    const updated = await tx.lobbyPlayer.update({
      where: { matchId_childId: { matchId, childId } },
      data: {
        x: clampedX,
        y: clampedZ,
        lastMoveAt: now,
        score: claimed > 0 ? { increment: claimed } : undefined,
      },
      select: { score: true },
    })
    return { claimed, score: updated.score }
  })

  return { ok: true, collectedIds: within.slice(0, result.claimed), newScore: result.score }
}

// ---------------------------------------------------------------------------
// getMatchState
// ---------------------------------------------------------------------------

export async function getMatchState(input: { matchId: string }): Promise<MatchState> {
  const { matchId } = MatchIdSchema.parse(input)
  const child = await requireChild()
  await assertMembership(matchId, child.id)

  const now = new Date()
  const fadeCutoff = new Date(now.getTime() - SPAWN_INTERVAL_MS)

  let match = await loadMatchWithTiles(matchId, fadeCutoff)

  if (match.status === 'ACTIVE' && match.endsAt && now > match.endsAt) {
    await _finalizeMatch(matchId)
    match = await loadMatchWithTiles(matchId, fadeCutoff)
  }

  if (
    match.status === 'ACTIVE' &&
    (!match.lastSpawnAt || now.getTime() - match.lastSpawnAt.getTime() > SPAWN_INTERVAL_MS)
  ) {
    const activeTiles = match.tiles.filter((t) => t.stompedById === null)
    const deficit = TARGET_ACTIVE_TILES - activeTiles.length
    if (deficit > 0) {
      await _spawnTiles(matchId, deficit, occupiedSet(activeTiles))
    }
    await prisma.lobbyMatch.update({
      where: { id: matchId },
      data: { lastSpawnAt: now },
    })
    const freshTiles = await prisma.lobbyTile.findMany({
      where: { matchId, OR: [{ stompedById: null }, { stompedAt: { gte: fadeCutoff } }] },
      select: { id: true, x: true, y: true, stompedById: true },
    })
    match = { ...match, tiles: freshTiles }
  }

  const me = match.players.find((p) => p.childId === child.id)
  if (!me) throw new Error('NOT_AUTHORIZED')

  const players: PlayerState[] = [...match.players].sort((a, b) => b.score - a.score)
  const tiles: TileState[] = match.tiles.map((t) => ({
    id: t.id,
    x: t.x,
    y: t.y,
    stompedById: t.stompedById,
  }))
  const timeLeftMs = match.endsAt ? Math.max(0, match.endsAt.getTime() - now.getTime()) : 0

  const state: MatchState = {
    matchId: match.id,
    status: match.status,
    startedAt: match.startedAt,
    endsAt: match.endsAt,
    timeLeftMs,
    me: { childId: me.childId, x: me.x, y: me.y, score: me.score },
    players,
    tiles,
  }

  if (match.status === 'FINISHED') {
    const leaderboard: LeaderboardEntry[] = players.map((p, i) => ({
      childId: p.childId,
      displayName: p.displayName,
      score: p.score,
      coinsEarned: p.score > 0 || i < 3 ? (PLACE_COINS[i] ?? 5) : 0,
    }))
    state.leaderboard = leaderboard
  }

  return state
}

// ---------------------------------------------------------------------------
// leaveMatch
// ---------------------------------------------------------------------------

export async function leaveMatch(input: { matchId: string }): Promise<void> {
  const { matchId } = MatchIdSchema.parse(input)
  const child = await requireChild()
  await prisma.lobbyPlayer.deleteMany({ where: { matchId, childId: child.id } })
}

// ---------------------------------------------------------------------------
// Re-export field constants so the client can render the matching world size.
// ---------------------------------------------------------------------------

export async function getArenaConfig(): Promise<{
  gridW: number
  gridH: number
  halfW: number
  halfD: number
  collectRadius: number
}> {
  return {
    gridW: GRID_W,
    gridH: GRID_H,
    halfW: FIELD_HALF_W,
    halfD: FIELD_HALF_D,
    collectRadius: Math.sqrt(COLLECT_RADIUS_SQ),
  }
}
