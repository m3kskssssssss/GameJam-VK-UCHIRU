'use client'
// Zustand store for transient game state.
// Coins/energy are seeded from the server on mount; mutated by mini-games via router.refresh().

import { create } from 'zustand'
import type { NpcKind } from '@/components/world/npcs-data'

export type { NpcKind }
export type HouseSubject = 'math' | 'reading' | 'english' | 'pe' | 'home'
export type FacingDirection = 'down' | 'up' | 'left' | 'right'

const SPEED = 4 // walk units per second
const RUN_MULTIPLIER = 2

const GRAVITY = 18 // m/s^2
const JUMP_IMPULSE = 6.5 // m/s — gives ~1.2m apex

const PITCH_MIN = 0.45
const PITCH_MAX = 1.05
const TWO_PI = Math.PI * 2

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function wrapAngle(a: number): number {
  // Wrap to (-π, π]
  const m = ((a + Math.PI) % TWO_PI + TWO_PI) % TWO_PI
  return m - Math.PI
}

interface GameState {
  position: [number, number, number]
  velocity: [number, number]
  velocityY: number
  isGrounded: boolean
  isRunning: boolean
  facing: FacingDirection
  /** World-space yaw (radians) the character's body is currently facing.
   *  Written by CharacterGLB each frame — used by the lobby heartbeat to
   *  broadcast the local player's orientation to remote clients. */
  playerYaw: number
  nearHouse: HouseSubject | null
  nearNpc: NpcKind | null
  halfX: number
  halfZ: number

  cameraYaw: number
  cameraPitch: number
  cameraDistance: number

  coins: number
  energy: number
  homeLevel: number

  // Actions
  setVelocity: (vx: number, vz: number) => void
  setNearHouse: (subject: HouseSubject | null) => void
  setNearNpc: (value: NpcKind | null) => void
  applyMovement: (dt: number) => void
  setSummary: (summary: { coins: number; energy: number; homeLevel: number }) => void
  setPosition: (x: number, y: number, z: number) => void
  setBounds: (halfX: number, halfZ: number) => void
  setCameraYaw: (yaw: number) => void
  addCameraYaw: (delta: number) => void
  setCameraPitch: (pitch: number) => void
  setCameraDistance: (d: number) => void
  jump: () => void
  setRunning: (on: boolean) => void
  setPlayerYaw: (yaw: number) => void
}

export const useGameStore = create<GameState>()((set) => ({
  position: [0, 0, 4],
  velocity: [0, 0],
  velocityY: 0,
  isGrounded: true,
  isRunning: false,
  facing: 'down',
  playerYaw: 0,
  nearHouse: null,
  nearNpc: null,
  halfX: 14,
  halfZ: 9,

  cameraYaw: 0,
  cameraPitch: 0.75,
  cameraDistance: 9,

  coins: 0,
  energy: 0,
  homeLevel: 1,

  setVelocity: (vx, vz) => {
    set((state) => {
      const len = Math.sqrt(vx * vx + vz * vz)
      const nx = len > 0 ? vx / len : 0
      const nz = len > 0 ? vz / len : 0
      let facing: FacingDirection = state.facing
      if (len > 0) {
        if (Math.abs(nx) >= Math.abs(nz)) facing = nx > 0 ? 'right' : 'left'
        else facing = nz > 0 ? 'down' : 'up'
      }
      return { velocity: [nx, nz], facing }
    })
  },

  setNearHouse: (subject) => set({ nearHouse: subject }),

  setNearNpc: (value) => set({ nearNpc: value }),

  applyMovement: (dt) => {
    set((state) => {
      const [vx, vz] = state.velocity

      // Horizontal movement (camera-relative).
      let nx = state.position[0]
      let nz = state.position[2]
      if (vx !== 0 || vz !== 0) {
        const yaw = state.cameraYaw
        const sy = Math.sin(yaw)
        const cy = Math.cos(yaw)
        const forwardInput = -vz
        const rightInput = vx
        const dx = -sy * forwardInput + cy * rightInput
        const dz = -cy * forwardInput - sy * rightInput
        const speed = state.isRunning ? SPEED * RUN_MULTIPLIER : SPEED
        nx = clamp(nx + dx * speed * dt, -state.halfX, state.halfX)
        nz = clamp(nz + dz * speed * dt, -state.halfZ, state.halfZ)
      }

      // Vertical (gravity + jump).
      let ny = state.position[1]
      let nvy = state.velocityY
      let grounded = state.isGrounded
      if (!grounded) {
        nvy -= GRAVITY * dt
        ny += nvy * dt
        if (ny <= 0) {
          ny = 0
          nvy = 0
          grounded = true
        }
      }

      if (
        nx === state.position[0] &&
        ny === state.position[1] &&
        nz === state.position[2] &&
        nvy === state.velocityY &&
        grounded === state.isGrounded
      ) {
        return state
      }

      return {
        position: [nx, ny, nz],
        velocityY: nvy,
        isGrounded: grounded,
      }
    })
  },

  setSummary: ({ coins, energy, homeLevel }) => set({ coins, energy, homeLevel }),

  setPosition: (x, y, z) =>
    set({
      position: [x, y, z],
      velocity: [0, 0],
      velocityY: 0,
      isGrounded: y <= 0,
    }),

  setBounds: (halfX, halfZ) => set({ halfX, halfZ }),

  setCameraYaw: (yaw) => set({ cameraYaw: wrapAngle(yaw) }),

  addCameraYaw: (delta) =>
    set((s) => ({ cameraYaw: wrapAngle(s.cameraYaw + delta) })),

  setCameraPitch: (pitch) =>
    set({ cameraPitch: clamp(pitch, PITCH_MIN, PITCH_MAX) }),

  setCameraDistance: (d) => set({ cameraDistance: clamp(d, 4, 16) }),

  jump: () =>
    set((s) => {
      if (!s.isGrounded) return s
      return { velocityY: JUMP_IMPULSE, isGrounded: false }
    }),

  setRunning: (on) => set({ isRunning: on }),

  // Mutate without React subscriptions — components that need playerYaw read
  // it via getState(). Avoids re-renders on every animation frame.
  setPlayerYaw: (yaw) => set({ playerYaw: wrapAngle(yaw) }),
}))
