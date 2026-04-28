'use server'
// Lobby mini-game server actions (Phase 7 — tile-stomp, 60 s rounds).

import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import {
  GRID_W, GRID_H, ROUND_DURATION_MS, TARGET_ACTIVE_TILES,
  SPAWN_INTERVAL_MS, MOVE_THROTTLE_MS, MAX_PLAYERS, PLACE_COINS,
  MatchIdSchema, MoveSchema,
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

  const startX = Math.floor(Math.random() * GRID_W)
  const startY = Math.floor(Math.random() * GRID_H)

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
    select: { status: true, players: { select: { x: true, y: true } } },
  })

  if (match.status === 'FINISHED') throw new Error('ROUND_FINISHED')
  if (match.status === 'ACTIVE') return

  const now = new Date()
  const endsAt = new Date(now.getTime() + ROUND_DURATION_MS)

  await prisma.lobbyMatch.update({
    where: { id: matchId },
    data: { status: 'ACTIVE', startedAt: now, endsAt, lastSpawnAt: now },
  })

  await _spawnTiles(matchId, TARGET_ACTIVE_TILES, occupiedSet([], match.players))
}

// ---------------------------------------------------------------------------
// movePlayer
// ---------------------------------------------------------------------------

export async function movePlayer(input: {
  matchId: string
  dx: -1 | 0 | 1
  dy: -1 | 0 | 1
}): Promise<{ ok: boolean }> {
  const parsed = MoveSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const { matchId, dx, dy } = parsed.data

  const child = await requireChild()
  const childId = child.id

  const match = await prisma.lobbyMatch.findUnique({
    where: { id: matchId },
    select: { status: true, endsAt: true },
  })
  if (!match || match.status !== 'ACTIVE') return { ok: false }

  const now = new Date()
  if (match.endsAt && now > match.endsAt) {
    await _finalizeMatch(matchId)
    return { ok: false }
  }

  const player = await prisma.lobbyPlayer.findUnique({
    where: { matchId_childId: { matchId, childId } },
    select: { x: true, y: true, lastMoveAt: true },
  })
  if (!player) throw new Error('NOT_AUTHORIZED')

  if (now.getTime() - player.lastMoveAt.getTime() < MOVE_THROTTLE_MS) return { ok: true }

  const nx = clamp(player.x + dx, 0, GRID_W - 1)
  const ny = clamp(player.y + dy, 0, GRID_H - 1)

  await prisma.$transaction(async (tx) => {
    const tile = await tx.lobbyTile.findUnique({
      where: { matchId_x_y: { matchId, x: nx, y: ny } },
      select: { id: true, stompedById: true },
    })
    if (tile && tile.stompedById === null) {
      await tx.lobbyTile.update({
        where: { id: tile.id },
        data: { stompedById: childId, stompedAt: now },
      })
      await tx.lobbyPlayer.update({
        where: { matchId_childId: { matchId, childId } },
        data: { x: nx, y: ny, lastMoveAt: now, score: { increment: 1 } },
      })
    } else {
      await tx.lobbyPlayer.update({
        where: { matchId_childId: { matchId, childId } },
        data: { x: nx, y: ny, lastMoveAt: now },
      })
    }
  })

  return { ok: true }
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
    const deficit = TARGET_ACTIVE_TILES - match.tiles.filter((t) => t.stompedById === null).length
    if (deficit > 0) {
      await _spawnTiles(matchId, deficit, occupiedSet(match.tiles, match.players))
    }
    await prisma.lobbyMatch.update({ where: { id: matchId }, data: { lastSpawnAt: now } })
    const freshTiles = await prisma.lobbyTile.findMany({
      where: { matchId, OR: [{ stompedById: null }, { stompedAt: { gte: fadeCutoff } }] },
      select: { x: true, y: true, stompedById: true },
    })
    match = { ...match, tiles: freshTiles }
  }

  const me = match.players.find((p) => p.childId === child.id)
  if (!me) throw new Error('NOT_AUTHORIZED')

  const players: PlayerState[] = [...match.players].sort((a, b) => b.score - a.score)
  const tiles: TileState[] = match.tiles.map((t) => ({ x: t.x, y: t.y, stompedById: t.stompedById }))
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
