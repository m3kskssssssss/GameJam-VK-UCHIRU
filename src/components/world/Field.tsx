'use client'
// Ground plane + perimeter fence for the outdoor world.

import * as THREE from 'three'
import { useMemo } from 'react'

const FIELD_W = 30
const FIELD_D = 20
const FENCE_H = 0.8
const FENCE_THICK = 0.2

// Fence colour
const FENCE_COLOR = '#8D6E63'

function FenceWall({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <mesh position={position} castShadow={false} receiveShadow={false}>
      <boxGeometry args={size} />
      <meshLambertMaterial color={FENCE_COLOR} />
    </mesh>
  )
}

export function Field() {
  // Build a simple repeating grid texture via canvas
  const groundTexture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Base colour
    ctx.fillStyle = '#8BC34A'
    ctx.fillRect(0, 0, size, size)

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    const cells = 8
    const step = size / cells
    for (let i = 0; i <= cells; i++) {
      ctx.beginPath()
      ctx.moveTo(i * step, 0)
      ctx.lineTo(i * step, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * step)
      ctx.lineTo(size, i * step)
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(6, 4)
    return tex
  }, [])

  const hw = FIELD_W / 2
  const hd = FIELD_D / 2

  return (
    <group>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow={false}
      />

      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={false}
      >
        <planeGeometry args={[FIELD_W, FIELD_D]} />
        <meshLambertMaterial map={groundTexture} />
      </mesh>

      {/* Fence walls: north, south, west, east */}
      {/* North (back) */}
      <FenceWall
        position={[0, FENCE_H / 2, -hd - FENCE_THICK / 2]}
        size={[FIELD_W + FENCE_THICK * 2, FENCE_H, FENCE_THICK]}
      />
      {/* South (front) */}
      <FenceWall
        position={[0, FENCE_H / 2, hd + FENCE_THICK / 2]}
        size={[FIELD_W + FENCE_THICK * 2, FENCE_H, FENCE_THICK]}
      />
      {/* West */}
      <FenceWall
        position={[-hw - FENCE_THICK / 2, FENCE_H / 2, 0]}
        size={[FENCE_THICK, FENCE_H, FIELD_D]}
      />
      {/* East */}
      <FenceWall
        position={[hw + FENCE_THICK / 2, FENCE_H / 2, 0]}
        size={[FENCE_THICK, FENCE_H, FIELD_D]}
      />
    </group>
  )
}
