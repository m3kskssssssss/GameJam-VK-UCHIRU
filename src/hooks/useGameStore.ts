'use client'
// Zustand store for transient game state.
// Coins/energy are seeded from the server on mount; mutated by mini-games via router.refresh().

import { create } from 'zustand'

export type HouseSubject = 'math' | 'reading' | 'english' | 'pe' | 'home'
export type FacingDirection = 'down' | 'up' | 'left' | 'right'

const FIELD_HALF_X = 14  // field is ~30 wide → ±14 walkable
const FIELD_HALF_Z = 9   // field is ~20 deep → ±9 walkable
const SPEED = 4           // units per second

interface GameState {
  // World position of the character
  position: [number, number, number]
  // Normalised movement input (-1..1 each axis)
  velocity: [number, number]
  facing: FacingDirection
  // Which house the character is near (within trigger radius)
  nearHouse: HouseSubject | null

  // Currency — seeded from server, not polled
  coins: number
  energy: number
  homeLevel: number

  // Actions
  setVelocity: (vx: number, vz: number) => void
  setNearHouse: (subject: HouseSubject | null) => void
  applyMovement: (dt: number) => void
  setSummary: (summary: { coins: number; energy: number; homeLevel: number }) => void
}

export const useGameStore = create<GameState>()((set) => ({
  position: [0, 0, 4],   // start slightly towards player
  velocity: [0, 0],
  facing: 'down',
  nearHouse: null,
  coins: 0,
  energy: 0,
  homeLevel: 1,

  setVelocity: (vx, vz) => {
    set((state) => {
      // Normalise diagonal movement so speed is consistent
      const len = Math.sqrt(vx * vx + vz * vz)
      const nx = len > 0 ? vx / len : 0
      const nz = len > 0 ? vz / len : 0

      // Determine facing direction from dominant axis
      let facing: FacingDirection = state.facing
      if (len > 0) {
        if (Math.abs(nx) >= Math.abs(nz)) {
          facing = nx > 0 ? 'right' : 'left'
        } else {
          facing = nz > 0 ? 'down' : 'up'
        }
      }

      return { velocity: [nx, nz], facing }
    })
  },

  setNearHouse: (subject) => set({ nearHouse: subject }),

  applyMovement: (dt) => {
    set((state) => {
      const [vx, vz] = state.velocity
      if (vx === 0 && vz === 0) return state

      const [px, py, pz] = state.position
      const nx = Math.max(-FIELD_HALF_X, Math.min(FIELD_HALF_X, px + vx * SPEED * dt))
      const nz = Math.max(-FIELD_HALF_Z, Math.min(FIELD_HALF_Z, pz + vz * SPEED * dt))
      return { position: [nx, py, nz] }
    })
  },

  setSummary: ({ coins, energy, homeLevel }) => set({ coins, energy, homeLevel }),
}))
