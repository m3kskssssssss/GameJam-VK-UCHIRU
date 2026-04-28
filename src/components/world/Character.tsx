'use client'
// Billboard character sprite. Uses a coloured plane + "K" label as placeholder.
// Final sprites will go into public/sprites/character/ and replace this.

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

// Generate a simple placeholder sprite as a canvas texture.
// A coloured circle with "K" in the centre — easy to swap for a real spritesheet.
function buildPlaceholderTexture(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Transparent background
  ctx.clearRect(0, 0, size, size)

  // Body circle
  ctx.beginPath()
  ctx.arc(32, 36, 24, 0, Math.PI * 2)
  ctx.fillStyle = '#FFD54F'
  ctx.fill()
  ctx.strokeStyle = '#F57F17'
  ctx.lineWidth = 2
  ctx.stroke()

  // Head circle
  ctx.beginPath()
  ctx.arc(32, 18, 12, 0, Math.PI * 2)
  ctx.fillStyle = '#FFECB3'
  ctx.fill()
  ctx.strokeStyle = '#F57F17'
  ctx.lineWidth = 2
  ctx.stroke()

  // Eyes
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(27, 16, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(37, 16, 2, 0, Math.PI * 2)
  ctx.fill()

  // Smile
  ctx.beginPath()
  ctx.arc(32, 20, 6, 0.2, Math.PI - 0.2)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

const CHAR_HEIGHT = 1.2
const CHAR_WIDTH = 0.9

export function Character() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const texture = useMemo(() => buildPlaceholderTexture(), [])

  useFrame((_, delta) => {
    const store = useGameStore.getState()

    // Advance position
    store.applyMovement(delta)

    const [px, py, pz] = store.position

    if (meshRef.current) {
      // Update mesh position
      meshRef.current.position.set(px, py + CHAR_HEIGHT / 2, pz)

      // Billboard: always face camera on Y axis only (vertical billboard)
      meshRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <mesh ref={meshRef} position={[0, CHAR_HEIGHT / 2, 4]}>
      <planeGeometry args={[CHAR_WIDTH, CHAR_HEIGHT]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
