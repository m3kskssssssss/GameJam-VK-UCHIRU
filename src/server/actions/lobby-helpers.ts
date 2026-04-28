// Internal helpers for lobby mini-game (Phase 7).
// Not a server action file — no 'use server' directive needed.
// Imported only by lobby.ts.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { addCoins } from '@/server/actions/progress'

// ---------------------------------------------------------------------------
// Grid / round constants
// ---------------------------------------------------------------------------

export const GRID_W = 12
export const GRID_H = 8
export const ROUND_DURATION_MS = 60_000
export const TARGET_ACTIVE_TILES = 10
export const SPAWN_INTERVAL_MS = 1500
export const MOVE_THROTTLE_MS = 80
export const MAX_PLAYERS = 8

// ---------------------------------------------------------------------------
// Zod schemas (exported so lobby.ts can import them)
// ---------------------------------------------------------------------------

export const MatchIdSchema = z.object({ matchId: z.string().cuid() })

export const MoveSchema = z.object({
  matchId: z.string().cuid(),
  dx: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  dy: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
})

// ---------------------------------------------------------------------------
// Return-type shapes
// ---------------------------------------------------------------------------

export type PlayerState = {
  childId: string
  displayName: string
  x: number
  y: number
  score: number
}

export type TileState = {
  x: number
  y: number
  stompedById: string | null
}

export type LeaderboardEntry = {
  childId: string
  displayName: string
  score: number
  coinsEarned: number
}

export type MatchState = {
  matchId: string
  status: string
  startedAt: Date | null
  endsAt: Date | null
  timeLeftMs: number
  me: { childId: string; x: number; y: number; score: number }
  players: PlayerState[]
  tiles: TileState[]
  leaderboard?: LeaderboardEntry[]
}

// ---------------------------------------------------------------------------
// _spawnTiles
// ---------------------------------------------------------------------------

/**
 * Generate `count` random (x, y) coordinates not in `occupied`,
 * then bulk-insert them. Uses try/catch to swallow unique-constraint
 * violations (SQLite has no ON CONFLICT IGNORE via createMany).
 */
export async function _spawnTiles(
  matchId: string,
  count: number,
  occupied: Set<string>,
): Promise<void> {
  if (count <= 0) return

  const coords: Array<{ x: number; y: number }> = []
  const seen = new Set<string>(occupied)
  let attempts = 0
  const maxAttempts = count * 20

  while (coords.length < count && attempts < maxAttempts) {
    attempts++
    const x = Math.floor(Math.random() * GRID_W)
    const y = Math.floor(Math.random() * GRID_H)
    const key = `${x},${y}`
    if (seen.has(key)) continue
    seen.add(key)
    coords.push({ x, y })
  }

  for (const coord of coords) {
    try {
      await prisma.lobbyTile.create({
        data: { matchId, x: coord.x, y: coord.y },
      })
    } catch {
      // Unique constraint violation — tile already exists at this coordinate.
      // Safe to ignore; another concurrent player may have spawned it first.
    }
  }
}

// ---------------------------------------------------------------------------
// loadMatchWithTiles — shared Prisma query used by getMatchState
// ---------------------------------------------------------------------------

type RawMatch = {
  id: string
  status: string
  startedAt: Date | null
  endsAt: Date | null
  lastSpawnAt: Date | null
  players: Array<{ childId: string; displayName: string; x: number; y: number; score: number }>
  tiles: Array<{ x: number; y: number; stompedById: string | null }>
}

export async function loadMatchWithTiles(matchId: string, fadeCutoff: Date): Promise<RawMatch> {
  return prisma.lobbyMatch.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      id: true, status: true, startedAt: true, endsAt: true, lastSpawnAt: true,
      players: { select: { childId: true, displayName: true, x: true, y: true, score: true } },
      tiles: {
        where: { OR: [{ stompedById: null }, { stompedAt: { gte: fadeCutoff } }] },
        select: { x: true, y: true, stompedById: true },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// _finalizeMatch
// ---------------------------------------------------------------------------

export const PLACE_COINS: Record<number, number> = { 0: 30, 1: 20, 2: 10 }
const PARTICIPATION_COINS = 5

/**
 * Mark a match FINISHED and award coins to all players.
 * Idempotent — returns immediately if already FINISHED.
 */
export async function _finalizeMatch(matchId: string): Promise<void> {
  const match = await prisma.lobbyMatch.findUnique({
    where: { id: matchId },
    select: { status: true, players: { select: { childId: true, displayName: true, score: true } } },
  })
  if (!match || match.status === 'FINISHED') return

  // Sort by score descending to determine places.
  const sorted = [...match.players].sort((a, b) => b.score - a.score)

  await prisma.lobbyMatch.update({
    where: { id: matchId },
    data: { status: 'FINISHED' },
  })

  // Award coins concurrently — addCoins is already atomic per child.
  await Promise.all(
    sorted.map((player, index) => {
      const base = PLACE_COINS[index] ?? PARTICIPATION_COINS
      const coins = player.score > 0 || index < 3 ? base : 0
      if (coins <= 0) return Promise.resolve()
      return addCoins(player.childId, coins)
    }),
  )
}

// ---------------------------------------------------------------------------
// occupiedSet — build a Set<"x,y"> from arrays of positions
// ---------------------------------------------------------------------------

export function occupiedSet(
  tiles: Array<{ x: number; y: number }>,
  players: Array<{ x: number; y: number }>,
): Set<string> {
  const set = new Set<string>()
  for (const t of tiles) set.add(`${t.x},${t.y}`)
  for (const p of players) set.add(`${p.x},${p.y}`)
  return set
}
