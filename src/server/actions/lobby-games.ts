'use server'
// Server actions for the 4 lobby mini-games (forest / reaction / memory / pairs).
// startLobbyGame  — debits energy when the child enters a round.
// finishLobbyGame — awards coins + XP for participation and victory.
// listOnlineFriends — returns other children currently in the lobby (for the
//   "with whom" picker shown in the portal config card).

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'
import { addCoins } from '@/server/actions/progress'
import { LOBBY_GAMES, type LobbyGameId } from '@/components/world/lobby-games-data'

const PRESENCE_STALE_MS = 8_000

const GameIdSchema = z.object({
  gameId: z.enum(['forest', 'reaction', 'memory', 'pairs']),
})

const FinishSchema = z.object({
  gameId: z.enum(['forest', 'reaction', 'memory', 'pairs']),
  score: z.number().int().min(0).max(10_000),
  won: z.boolean(),
  /** Optional opponent picked in the portal — purely informational. */
  opponentChildId: z.string().optional(),
})

function gameOrThrow(id: LobbyGameId) {
  const g = LOBBY_GAMES.find((x) => x.id === id)
  if (!g) throw new Error('UNKNOWN_GAME')
  return g
}

// ---------------------------------------------------------------------------
// startLobbyGame — debit energy and report new balance
// ---------------------------------------------------------------------------

export type StartLobbyGameResult =
  | { ok: true; energyLeft: number }
  | { ok: false; reason: 'NOT_ENOUGH_ENERGY'; energyLeft: number }

export async function startLobbyGame(input: {
  gameId: LobbyGameId
}): Promise<StartLobbyGameResult> {
  const parsed = GameIdSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const game = gameOrThrow(parsed.data.gameId)

  const child = await requireChild()

  return prisma.$transaction(async (tx) => {
    const row = await tx.child.findUniqueOrThrow({
      where: { id: child.id },
      select: { energy: true },
    })
    if (row.energy < game.energyCost) {
      return { ok: false as const, reason: 'NOT_ENOUGH_ENERGY' as const, energyLeft: row.energy }
    }
    const updated = await tx.child.update({
      where: { id: child.id },
      data: { energy: { decrement: game.energyCost } },
      select: { energy: true },
    })
    return { ok: true as const, energyLeft: updated.energy }
  })
}

// ---------------------------------------------------------------------------
// finishLobbyGame — award coins + XP based on game result
// ---------------------------------------------------------------------------

export interface FinishLobbyGameResult {
  coinsEarned: number
  xpEarned: number
  newCoins: number
  won: boolean
}

/** Add lobby XP. Subject games own SubjectProgress XP; lobby games credit a
 *  small bonus to MATH so it shows up on the dashboard's overall progress.
 *  Uses upsert so children that have never opened a subject mini-game still
 *  get credit. */
async function addLobbyXp(childId: string, amount: number): Promise<void> {
  if (amount <= 0) return
  await prisma.subjectProgress.upsert({
    where: { childId_subject: { childId, subject: 'MATH' } },
    create: { childId, subject: 'MATH', totalXp: amount },
    update: { totalXp: { increment: amount } },
  })
}

export async function finishLobbyGame(input: {
  gameId: LobbyGameId
  score: number
  won: boolean
  opponentChildId?: string
}): Promise<FinishLobbyGameResult> {
  const parsed = FinishSchema.safeParse(input)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const { gameId, won } = parsed.data
  const game = gameOrThrow(gameId)

  const child = await requireChild()

  const coins = game.coinsParticipation + (won ? game.coinsVictory : 0)
  const xp = game.xpParticipation + (won ? game.xpVictory : 0)

  await Promise.all([addCoins(child.id, coins), addLobbyXp(child.id, xp)])

  const updated = await prisma.child.findUniqueOrThrow({
    where: { id: child.id },
    select: { coins: true },
  })

  return {
    coinsEarned: coins,
    xpEarned: xp,
    newCoins: updated.coins,
    won,
  }
}

// ---------------------------------------------------------------------------
// listOnlineFriends — children currently inside the lobby world (for picker)
// ---------------------------------------------------------------------------

export interface OnlineFriend {
  childId: string
  displayName: string
}

export async function listOnlineFriends(): Promise<OnlineFriend[]> {
  const me = await requireChild()
  const cutoff = new Date(Date.now() - PRESENCE_STALE_MS)
  const rows = await prisma.lobbyPresence.findMany({
    where: { lastHeartbeatAt: { gt: cutoff } },
    select: { childId: true, displayName: true },
    orderBy: { lastHeartbeatAt: 'desc' },
    take: 16,
  })
  return rows
    .filter((r) => r.childId !== me.id)
    .map((r) => ({ childId: r.childId, displayName: r.displayName }))
}
