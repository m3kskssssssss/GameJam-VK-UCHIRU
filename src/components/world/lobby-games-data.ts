// Metadata for the 4 lobby mini-games. Each game is anchored to one of the
// 4 corner doors in lobby-scene-data.ts — the LobbyWorld renders one portal
// per game, pulled `pullback` units toward the centre of the map.

import { LOBBY_SCENE_INSTANCES } from './lobby-scene-data'

export type LobbyGameId = 'forest' | 'reaction' | 'memory' | 'pairs'

export interface LobbyGame {
  id: LobbyGameId
  /** Door label inside lobby-scene-data.ts (anchor for the portal). */
  doorLabel: string
  route: string
  title: string
  short: string
  /** Hex color for the portal ring. */
  color: string
  /** Energy debited when the child starts a round. */
  energyCost: number
  /** Coins awarded for participation (regardless of result). */
  coinsParticipation: number
  /** Coins awarded on top when the child meets the win condition. */
  coinsVictory: number
  /** XP awarded for participation. */
  xpParticipation: number
  /** XP awarded on top for a win. */
  xpVictory: number
  /** Win threshold — interpretation is per-game (score, rounds, moves...). */
  winThreshold: number
}

export const LOBBY_GAMES: readonly LobbyGame[] = [
  {
    id: 'forest',
    doorLabel: 'Door.glb', // NW corner
    route: '/play/lobby/forest',
    title: 'Лесные монеты',
    short: 'Собирай монетки в лесу — 30 секунд!',
    color: '#5BC675',
    energyCost: 5,
    coinsParticipation: 3,
    coinsVictory: 10,
    xpParticipation: 3,
    xpVictory: 8,
    winThreshold: 8,
  },
  {
    id: 'reaction',
    doorLabel: 'Door.glb 2', // SW corner
    route: '/play/lobby/reaction',
    title: 'Реакция',
    short: 'Лови зелёные кружки и не задевай красные.',
    color: '#E76F6F',
    energyCost: 5,
    coinsParticipation: 2,
    coinsVictory: 10,
    xpParticipation: 2,
    xpVictory: 8,
    winThreshold: 10,
  },
  {
    id: 'memory',
    doorLabel: 'Door.glb 3', // NE corner
    route: '/play/lobby/memory',
    title: 'Память',
    short: 'Повторяй последовательность цветов как можно дольше.',
    color: '#4DA8DA',
    energyCost: 5,
    coinsParticipation: 2,
    coinsVictory: 10,
    xpParticipation: 2,
    xpVictory: 8,
    winThreshold: 5,
  },
  {
    id: 'pairs',
    doorLabel: 'Door.glb 4', // SE corner
    route: '/play/lobby/pairs',
    title: 'Найди пару',
    short: 'Открой все пары карточек за наименьшее число ходов.',
    color: '#FFD86E',
    energyCost: 5,
    coinsParticipation: 2,
    coinsVictory: 10,
    xpParticipation: 2,
    xpVictory: 8,
    winThreshold: 16,
  },
] as const

export const PORTAL_PULLBACK = 5

/** World-space portal position for a given game, computed from the door
 *  position and pulled `PORTAL_PULLBACK` units back toward the lobby centre. */
export function portalPositionFor(game: LobbyGame): [number, number, number] {
  const door = LOBBY_SCENE_INSTANCES.find((i) => i.label === game.doorLabel)
  if (!door) throw new Error(`Door not found: ${game.doorLabel}`)
  const [dx, , dz] = door.position
  const len = Math.hypot(dx, dz) || 1
  const nx = dx / len
  const nz = dz / len
  return [dx - nx * PORTAL_PULLBACK, 0.05, dz - nz * PORTAL_PULLBACK]
}

export function gameById(id: LobbyGameId): LobbyGame {
  const found = LOBBY_GAMES.find((g) => g.id === id)
  if (!found) throw new Error(`Unknown lobby game: ${id}`)
  return found
}
