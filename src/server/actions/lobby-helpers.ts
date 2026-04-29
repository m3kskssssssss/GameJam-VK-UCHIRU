// Internal helpers for lobby mini-game.
// Not a server action file — no 'use server' directive needed.
// Imported only by lobby.ts.

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { addCoins } from '@/server/actions/progress'

// ---------------------------------------------------------------------------
// Field / round constants
// ---------------------------------------------------------------------------

// Field is laid out in cells. Coins live at integer cell centres; player
// position is continuous (Float in DB).
export const GRID_W = 24
export const GRID_H = 16
export const FIELD_HALF_W = GRID_W / 2 // world half-extent in X
export const FIELD_HALF_D = GRID_H / 2 // world half-extent in Z
export const COLLECT_RADIUS = 0.7
export const COLLECT_RADIUS_SQ = COLLECT_RADIUS * COLLECT_RADIUS

export const ROUND_DURATION_MS = 60_000
export const TARGET_ACTIVE_TILES = 14
export const SPAWN_INTERVAL_MS = 1500
export const POSITION_THROTTLE_MS = 60
export const MAX_PLAYERS = 8

// ---------------------------------------------------------------------------
// Zod schemas (exported so lobby.ts can import them)
// ---------------------------------------------------------------------------

export const MatchIdSchema = z.object({ matchId: z.string().cuid() })

export const PositionSchema = z.object({
  matchId: z.string().cuid(),
  x: z.number().finite(),
  y: z.number().finite(),
})

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

/** Convert grid cell (col, row) to world (x, z) at the cell centre. */
export function cellToWorld(col: number, row: number): { x: number; z: number } {
  return { x: col - GRID_W / 2 + 0.5, z: row - GRID_H / 2 + 0.5 }
}

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
  id: string
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
 * violations.
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
  const maxAttempts = count * 30

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
      // Unique violation — another concurrent caller picked this cell.
    }
  }
}

// ---------------------------------------------------------------------------
// loadMatchWithTiles
// ---------------------------------------------------------------------------

type RawMatch = {
  id: string
  status: string
  startedAt: Date | null
  endsAt: Date | null
  lastSpawnAt: Date | null
  players: Array<{
    childId: string
    displayName: string
    x: number
    y: number
    score: number
  }>
  tiles: Array<{ id: string; x: number; y: number; stompedById: string | null }>
}

export async function loadMatchWithTiles(matchId: string, fadeCutoff: Date): Promise<RawMatch> {
  return prisma.lobbyMatch.findUniqueOrThrow({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      endsAt: true,
      lastSpawnAt: true,
      players: { select: { childId: true, displayName: true, x: true, y: true, score: true } },
      tiles: {
        where: { OR: [{ stompedById: null }, { stompedAt: { gte: fadeCutoff } }] },
        select: { id: true, x: true, y: true, stompedById: true },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// _finalizeMatch — distribute round prizes
// ---------------------------------------------------------------------------

export const PLACE_COINS: Record<number, number> = { 0: 30, 1: 20, 2: 10 }
const PARTICIPATION_COINS = 5

export async function _finalizeMatch(matchId: string): Promise<void> {
  const match = await prisma.lobbyMatch.findUnique({
    where: { id: matchId },
    select: {
      status: true,
      players: { select: { childId: true, displayName: true, score: true } },
    },
  })
  if (!match || match.status === 'FINISHED') return

  const sorted = [...match.players].sort((a, b) => b.score - a.score)

  await prisma.lobbyMatch.update({
    where: { id: matchId },
    data: { status: 'FINISHED' },
  })

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
// occupiedSet — build a Set<"x,y"> from arrays of coin positions
// ---------------------------------------------------------------------------

export function occupiedSet(tiles: Array<{ x: number; y: number }>): Set<string> {
  const set = new Set<string>()
  for (const t of tiles) set.add(`${t.x},${t.y}`)
  return set
}
