'use client'
// Renders one remote player in the lobby — same Meshy biped as the local
// CharacterGLB, but driven by polled (x,z) coordinates instead of the local
// game store. Position is lerped toward the target so updates feel smooth
// despite the ~500 ms server poll. A billboarded nameplate (rounded black
// pill, white text) floats above the head.

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html, useAnimations, useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

const PATHS = {
  BOY: { mesh: '/characters/boy.glb', anim: '/characters/boy_animations.glb' },
  GIRL: { mesh: '/characters/girl.glb', anim: '/characters/girl_animations.glb' },
} as const

type Gender = keyof typeof PATHS

interface Props {
  displayName: string
  gender: Gender
  /** Target world-space position. The component lerps toward it. */
  targetPosition: [number, number]
}

export function RemoteLobbyPlayer({ displayName, gender, targetPosition }: Props) {
  const paths = PATHS[gender]
  const groupRef = useRef<THREE.Group>(null)
  const characterRef = useRef<THREE.Group>(null)
  const facingYawRef = useRef(0)
  const lastPosRef = useRef<[number, number]>(targetPosition)

  const meshGltf = useGLTF(paths.mesh)
  const animGltf = useGLTF(paths.anim)

  const cloned = useMemo(
    () => skeletonClone(meshGltf.scene) as THREE.Object3D,
    [meshGltf.scene],
  )

  const { actions } = useAnimations(animGltf.animations, cloned)

  useEffect(() => {
    const walking = actions.Walking
    if (walking) {
      walking.reset()
      walking.play()
      walking.timeScale = 0
      walking.weight = 1
    }
  }, [actions])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    // Lerp current position toward target.
    const cur = g.position
    const targetX = targetPosition[0]
    const targetZ = targetPosition[1]
    const dx = targetX - cur.x
    const dz = targetZ - cur.z
    const dist = Math.hypot(dx, dz)
    const speed = Math.min(1, delta * 8)
    cur.x += dx * speed
    cur.z += dz * speed

    // Animate walking when moving noticeably.
    const walking = actions.Walking
    if (walking) {
      const isMoving = dist > 0.05
      walking.timeScale = isMoving ? 1 : 0
      if (!isMoving) walking.time = 0
    }

    // Yaw toward movement direction.
    if (characterRef.current && dist > 0.001) {
      const targetYaw = Math.atan2(dx, dz)
      let diff = targetYaw - facingYawRef.current
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const next = facingYawRef.current + diff * Math.min(1, delta * 10)
      facingYawRef.current = next
      characterRef.current.rotation.y = next
    }

    lastPosRef.current = [targetX, targetZ]
  })

  return (
    <group ref={groupRef} position={[targetPosition[0], 0, targetPosition[1]]}>
      <group ref={characterRef}>
        <primitive object={cloned} />
      </group>
      <Billboard follow position={[0, 2.4, 0]}>
        <Html center distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(15,23,42,0.85)',
              color: '#FFFFFF',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              userSelect: 'none',
            }}
          >
            {displayName}
          </div>
        </Html>
      </Billboard>
    </group>
  )
}

useGLTF.preload(PATHS.BOY.mesh)
useGLTF.preload(PATHS.BOY.anim)
useGLTF.preload(PATHS.GIRL.mesh)
useGLTF.preload(PATHS.GIRL.anim)
