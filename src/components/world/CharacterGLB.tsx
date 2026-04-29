'use client'
// 3D character driven by the game store. Loads a Meshy-exported biped GLB
// (boy or girl) and the matching merged-animations GLB (Walking + Running clips).
// State machine:
//   - moving + isRunning → Running
//   - moving + walking   → Walking
//   - idle               → Walking action paused at frame 0 (no separate Idle clip)
// Vertical position from store.position[1] (gravity/jump applied in store).

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGameStore } from '@/hooks/useGameStore'

// 0.75 of a Mattercraft house "floor". Houses are scaled [4,4,4] in scene
// (raw GLB ~1.64 m → ~6.56 m scaled total → wall portion ~3.3 m → 0.75 ≈ 2.5 m).
// Boy raw height ~1.93 m → ~1.3× scale gives ~2.5 m.
const CHAR_SCALE = 1.3

const CHAR_PATHS = {
  BOY: { mesh: '/characters/boy.glb', anim: '/characters/boy_animations.glb' },
  GIRL: { mesh: '/characters/girl.glb', anim: '/characters/girl_animations.glb' },
} as const

export type CharacterGender = keyof typeof CHAR_PATHS

interface CharacterGLBProps {
  gender: CharacterGender
}

export function CharacterGLB({ gender }: CharacterGLBProps) {
  const paths = CHAR_PATHS[gender]
  const groupRef = useRef<THREE.Group>(null)
  const characterRef = useRef<THREE.Group>(null)
  const facingYawRef = useRef(0)

  const meshGltf = useGLTF(paths.mesh)
  const animGltf = useGLTF(paths.anim)

  // Skinned meshes need SkeletonUtils.clone to keep bone hierarchy intact.
  const cloned = useMemo(
    () => skeletonClone(meshGltf.scene) as THREE.Object3D,
    [meshGltf.scene],
  )

  const { actions } = useAnimations(animGltf.animations, cloned)

  // Start with Walking paused at t=0 as the idle pose. We modulate timeScale
  // to switch between idle / walk / run.
  useEffect(() => {
    const walking = actions.Walking
    const running = actions.Running
    if (walking) {
      walking.reset()
      walking.play()
      walking.timeScale = 0
    }
    if (running) {
      running.reset()
      running.play()
      running.timeScale = 0
      running.weight = 0
    }
  }, [actions])

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    s.applyMovement(delta)

    const [px, py, pz] = s.position
    const [vx, vz] = s.velocity
    const moving = vx !== 0 || vz !== 0

    if (groupRef.current) {
      groupRef.current.position.set(px, py, pz)
    }

    // Yaw the character toward movement direction (camera-relative input → world).
    if (moving && characterRef.current) {
      const yaw = s.cameraYaw
      const sy = Math.sin(yaw)
      const cy = Math.cos(yaw)
      const dx = -sy * -vz + cy * vx
      const dz = -cy * -vz - sy * vx
      const targetYaw = Math.atan2(dx, dz)
      // Smooth rotation
      const cur = facingYawRef.current
      let diff = targetYaw - cur
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const next = cur + diff * Math.min(1, delta * 12)
      facingYawRef.current = next
      characterRef.current.rotation.y = next
    }

    // Animation state: pick clip and scale weights/speed.
    const walking = actions.Walking
    const running = actions.Running
    if (!walking || !running) return

    if (!moving) {
      // Idle pose
      walking.timeScale = 0
      walking.time = 0
      walking.weight = 1
      running.weight = 0
    } else if (s.isRunning) {
      walking.weight = 0
      running.weight = 1
      running.timeScale = 1
    } else {
      walking.weight = 1
      walking.timeScale = 1
      running.weight = 0
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={characterRef} scale={CHAR_SCALE}>
        <primitive object={cloned} />
      </group>
    </group>
  )
}

useGLTF.preload(CHAR_PATHS.BOY.mesh)
useGLTF.preload(CHAR_PATHS.BOY.anim)
useGLTF.preload(CHAR_PATHS.GIRL.mesh)
useGLTF.preload(CHAR_PATHS.GIRL.anim)
