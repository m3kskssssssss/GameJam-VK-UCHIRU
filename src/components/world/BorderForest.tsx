'use client'
// Decorative ring of "forest" tiles surrounding the playable scene. Each tile
// is a square with fon.png as the floor and 8 trees + 8 bushes + 12 grass
// patches scattered on top, deterministically placed by a per-tile seed so
// the layout is stable between renders.
//
// The bounds in useGameStore keep the player inside the central tile, so the
// border ring is purely visual — it fills the empty horizon and stops the
// world from looking like a floating square.

import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const FOREST_FLOOR_SRC = '/textures/fon.png'

// Canonical scale + ground-y offset matched to /play/SCENA so the props sit
// on the ground exactly the way they do in the main scene. The Mattercraft
// GLBs have their pivot below the visible mesh; the y values below are taken
// from real instances in mattercraft-scene-data.ts and they must be scaled
// alongside `baseScale` so the trunk/base lands at y=0 on the forest floor.
const ASSETS = {
  Tree_Bigger:  { url: '/scena/Tree_Bigger.glb',  baseScale: 4.0, baseY: 3.925488, footprint: 5.0 },
  Bush_Classik: { url: '/scena/Bush_Classik.glb', baseScale: 1.0, baseY: 0.689669, footprint: 1.6 },
  Grass:        { url: '/scena/Grass.glb',        baseScale: 1.0, baseY: 0.436617, footprint: 1.0 },
} as const

type AssetKey = keyof typeof ASSETS

interface DecorItem {
  asset: AssetKey
  position: [number, number, number]
  rotationY: number
  scale: number
}

// ---------------------------------------------------------------------------
// PRNG (Mulberry32) — same routine used by the math content generator.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Layout generator — rejection sampling with per-asset min distances.
// ---------------------------------------------------------------------------

interface PlacedDot {
  x: number
  z: number
  r: number
}

function generateLayout(seed: number, tileSize: number): DecorItem[] {
  const rng = mulberry32(seed)
  const half = tileSize / 2
  const margin = 1.5
  const placed: PlacedDot[] = []
  const items: DecorItem[] = []

  function tryPlace(asset: AssetKey, count: number) {
    const { footprint, baseScale, baseY } = ASSETS[asset]
    const attempts = 120
    for (let n = 0; n < count; n++) {
      let ok = false
      for (let a = 0; a < attempts && !ok; a++) {
        const x = (rng() * 2 - 1) * (half - margin)
        const z = (rng() * 2 - 1) * (half - margin)
        // Check non-overlap with everything already placed.
        let collide = false
        for (const p of placed) {
          const dx = x - p.x
          const dz = z - p.z
          const minDist = (p.r + footprint) * 0.85
          if (dx * dx + dz * dz < minDist * minDist) {
            collide = true
            break
          }
        }
        if (collide) continue
        placed.push({ x, z, r: footprint })
        // Light scale jitter — y offset must scale with it so the prop's base
        // stays planted on the ground regardless of size variation.
        const scaleJitter = 0.9 + rng() * 0.25
        const finalScale = baseScale * scaleJitter
        const y = baseY * scaleJitter
        items.push({
          asset,
          position: [x, y, z],
          rotationY: rng() * Math.PI * 2,
          scale: finalScale,
        })
        ok = true
      }
    }
  }

  // Largest first so smaller props can fill remaining gaps.
  tryPlace('Tree_Bigger', 8)
  tryPlace('Bush_Classik', 8)
  tryPlace('Grass', 12)
  return items
}

// ---------------------------------------------------------------------------
// Per-asset instanced cloning — each instance is a deep clone of the GLB
// scene. Trees/bushes have static geometry so this is fine memory-wise.
// ---------------------------------------------------------------------------

interface DecorRendererProps {
  asset: AssetKey
  items: Array<{ key: string; position: [number, number, number]; rotationY: number; scale: number }>
}

function DecorRenderer({ asset, items }: DecorRendererProps) {
  const { scene } = useGLTF(ASSETS[asset].url)
  const clones = useMemo(
    () =>
      items.map(() => {
        const c = scene.clone(true)
        c.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh) {
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })
        return c
      }),
    [items, scene],
  )
  return (
    <>
      {items.map((it, idx) => (
        <primitive
          key={it.key}
          object={clones[idx]}
          position={it.position}
          rotation={[0, it.rotationY, 0]}
          scale={[it.scale, it.scale, it.scale]}
        />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface BorderForestProps {
  /** Side length of the central playable area (and of every border tile). */
  tileSize: number
  /** Optional shift of the whole 3×3 ring in world space. */
  centerOffset?: [number, number]
  /** Lifts the forest floor slightly below 0 so it doesn't z-fight with the
   *  central scene's ground when their edges meet. */
  groundY?: number
}

// 5×5 grid of surrounding tiles (center cell skipped — that's the playable
// scene). 24 tiles total — gives a deeper forest so the horizon doesn't end
// abruptly at the first ring.
const RING_OFFSETS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = []
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dz === 0) continue
      out.push([dx, dz])
    }
  }
  return out
})()

export function BorderForest({
  tileSize,
  centerOffset = [0, 0],
  groundY = -0.02,
}: BorderForestProps) {
  const fonTex = useTexture(FOREST_FLOOR_SRC)
  fonTex.wrapS = THREE.RepeatWrapping
  fonTex.wrapT = THREE.RepeatWrapping
  fonTex.colorSpace = THREE.SRGBColorSpace
  fonTex.anisotropy = 8

  // Build per-tile data: each of the 8 ring cells gets its own seed and yaw.
  const tiles = useMemo(() => {
    return RING_OFFSETS.map(([dx, dz], i) => {
      const seed = 1000 + i * 17 + Math.round(tileSize)
      const yaw = (i % 4) * (Math.PI / 2) // 0, 90, 180, 270 — square-friendly
      const layout = generateLayout(seed, tileSize)
      return {
        key: `tile-${i}`,
        ox: dx * tileSize + centerOffset[0],
        oz: dz * tileSize + centerOffset[1],
        yaw,
        layout,
      }
    })
  }, [tileSize, centerOffset])

  return (
    <group>
      {tiles.map((tile) => {
        // Group decor by asset so DecorRenderer can clone the GLB once per item.
        const trees: DecorRendererProps['items'] = []
        const bushes: DecorRendererProps['items'] = []
        const grasses: DecorRendererProps['items'] = []
        tile.layout.forEach((it, idx) => {
          const entry = {
            key: `${tile.key}-${idx}`,
            position: it.position,
            rotationY: it.rotationY,
            scale: it.scale,
          }
          if (it.asset === 'Tree_Bigger') trees.push(entry)
          else if (it.asset === 'Bush_Classik') bushes.push(entry)
          else grasses.push(entry)
        })

        return (
          <group
            key={tile.key}
            position={[tile.ox, 0, tile.oz]}
            rotation={[0, tile.yaw, 0]}
          >
            {/* Floor — fon.png stretched once across the tile */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, groundY, 0]}
              receiveShadow
            >
              <planeGeometry args={[tileSize, tileSize]} />
              <meshStandardMaterial
                map={fonTex}
                roughness={1}
                metalness={0}
              />
            </mesh>
            <DecorRenderer asset="Tree_Bigger" items={trees} />
            <DecorRenderer asset="Bush_Classik" items={bushes} />
            <DecorRenderer asset="Grass" items={grasses} />
          </group>
        )
      })}
    </group>
  )
}

useGLTF.preload(ASSETS.Tree_Bigger.url)
useGLTF.preload(ASSETS.Bush_Classik.url)
useGLTF.preload(ASSETS.Grass.url)
useTexture.preload(FOREST_FLOOR_SRC)
