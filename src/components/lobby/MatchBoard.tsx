'use client'
// Phase 7 — MatchBoard renders the 12×8 stomp-tile grid.
// Tiles: gold circles. Players: coloured dots with initial. "Me": blue.

import type { MatchState } from '@/server/actions/lobby-helpers'
import { GRID_W, GRID_H } from '@/server/actions/lobby-helpers'

interface Props {
  state: MatchState
}

// Deterministic colour per childId (hue cycling)
const PLAYER_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-lime-500',
  'bg-yellow-600',
  'bg-indigo-500',
]

function getPlayerColor(childId: string, meId: string, index: number): string {
  if (childId === meId) return 'bg-blue-500'
  return PLAYER_COLORS[index % PLAYER_COLORS.length] ?? 'bg-gray-400'
}

export function MatchBoard({ state }: Props) {
  const { me, players, tiles } = state

  // Build lookup maps for O(1) cell queries
  const tileSet = new Set<string>()
  const stompedSet = new Set<string>()
  for (const tile of tiles) {
    const key = `${tile.x},${tile.y}`
    if (tile.stompedById === null) {
      tileSet.add(key)
    } else {
      stompedSet.add(key)
    }
  }

  const playerMap = new Map<string, { displayName: string; colorClass: string }>()
  players.forEach((p, i) => {
    playerMap.set(`${p.x},${p.y}`, {
      displayName: p.displayName,
      colorClass: getPlayerColor(p.childId, me.childId, i),
    })
  })

  return (
    <div
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-green-800 p-1"
      role="grid"
      aria-label="Игровое поле"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_W}, minmax(0, 1fr))`,
          gap: '2px',
        }}
      >
        {Array.from({ length: GRID_H }, (_, row) =>
          Array.from({ length: GRID_W }, (_, col) => {
            const key = `${col},${row}`
            const hasTile = tileSet.has(key)
            const isStomped = stompedSet.has(key)
            const player = playerMap.get(key)

            return (
              <div
                key={key}
                className="relative flex aspect-square items-center justify-center rounded-sm bg-green-700"
                role="gridcell"
                aria-label={`${col},${row}`}
              >
                {/* Active tile */}
                {hasTile && (
                  <span
                    className="absolute inset-[15%] rounded-full bg-yellow-400 shadow-md shadow-yellow-300"
                    aria-hidden="true"
                  />
                )}
                {/* Stomped tile (fading) */}
                {isStomped && (
                  <span
                    className="absolute inset-[15%] rounded-full bg-yellow-200/50"
                    aria-hidden="true"
                  />
                )}
                {/* Player dot */}
                {player && (
                  <span
                    className={`absolute inset-[10%] z-10 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${player.colorClass} shadow-lg`}
                    aria-label={player.displayName}
                  >
                    {player.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
