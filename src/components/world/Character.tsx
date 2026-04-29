'use client'
// 2D billboard character with a 3-frame walk cycle (idle / step-A / step-B).
// Frames are drawn once into canvas textures and swapped via material.map.

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

type Frame = 'idle' | 'walkA' | 'walkB'

const CHAR_HEIGHT = 1.5
const CHAR_WIDTH = 1.0
const STEP_PERIOD = 0.22 // seconds per walk frame

function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame) {
  const W = 64
  const H = 96
  ctx.clearRect(0, 0, W, H)
  ctx.imageSmoothingEnabled = true

  // ── Hair (back) ──
  ctx.fillStyle = '#5D4037'
  ctx.beginPath()
  ctx.ellipse(32, 14, 12, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // ── Head (skin) ──
  ctx.fillStyle = '#FFE0B2'
  ctx.beginPath()
  ctx.arc(32, 20, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#A67C52'
  ctx.lineWidth = 1.2
  ctx.stroke()

  // ── Eyes ──
  ctx.fillStyle = '#1F2937'
  ctx.beginPath()
  ctx.arc(28, 21, 1.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(36, 21, 1.6, 0, Math.PI * 2)
  ctx.fill()

  // ── Smile ──
  ctx.strokeStyle = '#1F2937'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(32, 24, 3, 0.3, Math.PI - 0.3)
  ctx.stroke()

  // ── Body / shirt ──
  ctx.fillStyle = '#4DA8DA'
  roundedRect(ctx, 22, 30, 20, 24, 3)
  ctx.fill()
  ctx.strokeStyle = '#2980B9'
  ctx.lineWidth = 1.2
  ctx.stroke()

  // Arm swing (counter to legs for walking feel)
  const armSwing =
    frame === 'walkA' ? 4 : frame === 'walkB' ? -4 : 0

  // ── Left arm ──
  ctx.fillStyle = '#FFE0B2'
  roundedRect(ctx, 16, 32 + armSwing, 6, 18, 2)
  ctx.fill()
  ctx.strokeStyle = '#A67C52'
  ctx.stroke()

  // ── Right arm ──
  ctx.fillStyle = '#FFE0B2'
  roundedRect(ctx, 42, 32 - armSwing, 6, 18, 2)
  ctx.fill()
  ctx.stroke()

  // ── Pants ──
  ctx.fillStyle = '#1F2937'
  roundedRect(ctx, 22, 54, 20, 12, 2)
  ctx.fill()

  // ── Legs ──
  // walkA: left leg forward (down on screen), right leg back
  // walkB: right leg forward, left leg back
  const leftLegY = frame === 'walkA' ? 68 : frame === 'walkB' ? 64 : 66
  const rightLegY = frame === 'walkB' ? 68 : frame === 'walkA' ? 64 : 66

  ctx.fillStyle = '#3F2A1A'
  roundedRect(ctx, 24, leftLegY, 6, 16, 1.5)
  ctx.fill()
  roundedRect(ctx, 34, rightLegY, 6, 16, 1.5)
  ctx.fill()

  // Shoes
  ctx.fillStyle = '#1F2937'
  ctx.fillRect(23, leftLegY + 14, 8, 4)
  ctx.fillRect(33, rightLegY + 14, 8, 4)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function makeFrameTexture(frame: Frame): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 96
  const ctx = canvas.getContext('2d')!
  drawFrame(ctx, frame)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

export function Character() {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const { camera } = useThree()

  const textures = useMemo(
    () => ({
      idle: makeFrameTexture('idle'),
      walkA: makeFrameTexture('walkA'),
      walkB: makeFrameTexture('walkB'),
    }),
    [],
  )

  const animState = useRef({ elapsed: 0, frame: 'idle' as Frame })

  useFrame((_, delta) => {
    const store = useGameStore.getState()
    store.applyMovement(delta)

    const [px, py, pz] = store.position
    const [vx, vz] = store.velocity
    const moving = vx !== 0 || vz !== 0

    // Advance walk cycle when moving
    let nextFrame: Frame = 'idle'
    if (moving) {
      animState.current.elapsed += delta
      const phase = Math.floor(animState.current.elapsed / STEP_PERIOD) % 2
      nextFrame = phase === 0 ? 'walkA' : 'walkB'
    } else {
      animState.current.elapsed = 0
    }

    if (animState.current.frame !== nextFrame && matRef.current) {
      animState.current.frame = nextFrame
      matRef.current.map = textures[nextFrame]
      matRef.current.needsUpdate = true
    }

    if (meshRef.current) {
      // Subtle bob while moving — adds liveliness without breaking billboard
      const bob = moving ? Math.sin(animState.current.elapsed * 12) * 0.04 : 0
      meshRef.current.position.set(px, py + CHAR_HEIGHT / 2 + bob, pz)
      // Vertical billboard: copy camera quaternion so the sprite always faces
      // the camera, even as it lerps.
      meshRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <mesh ref={meshRef} position={[0, CHAR_HEIGHT / 2, 4]}>
      <planeGeometry args={[CHAR_WIDTH, CHAR_HEIGHT]} />
      <meshBasicMaterial
        ref={matRef}
        map={textures.idle}
        transparent
        alphaTest={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
