'use client'
// Third-person follow camera (Genshin/Zelda style).
// Reads cameraYaw / cameraPitch / cameraDistance from useGameStore so any UI
// (joystick, mouse drag, keys) can drive it.
//
// Smoothing is frame-rate independent. We track BOTH the camera position
// AND the look-at target through the same exponential decay, then anchor
// the desired camera position off the smoothed target. That way the camera
// and its aim move together — when the player jitters by sub-frame deltas
// (variable frame times, integer-clamped motion etc.) the look angle stays
// rock solid because both ends of the look vector smooth identically.

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

// Smoothing rate (1/seconds). 10 ≈ 0.16 lerp factor at 60 fps — gentle, but
// because the lookAt target is also smoothed there's no perceptible lag.
const FOLLOW_RATE = 10

interface Props {
  /** Override the in-store camera distance for this scene. */
  distance?: number
  /** Where the camera looks (above ground), in world units above the player. */
  headHeight?: number
}

export function CameraRig({ distance, headHeight = 0.9 }: Props = {}) {
  const { camera, size } = useThree()

  const scratch = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      target: new THREE.Vector3(),
    }),
    [],
  )
  const initialised = useRef(false)

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const [px, , pz] = s.position
    const yaw = s.cameraYaw
    const pitch = s.cameraPitch
    const dist = distance ?? s.cameraDistance

    const cosP = Math.cos(pitch)
    const sinP = Math.sin(pitch)
    const sinY = Math.sin(yaw)
    const cosY = Math.cos(yaw)

    const t = 1 - Math.exp(-FOLLOW_RATE * delta)

    // First frame: snap the smoothed look target to the player so we don't
    // fly in from world origin.
    if (!initialised.current) {
      scratch.target.set(px, headHeight, pz)
      initialised.current = true
    } else {
      // Per-axis lerp toward the player's head — avoids allocating a fresh
      // Vector3 every frame just to call Vector3.lerp().
      scratch.target.x = THREE.MathUtils.lerp(scratch.target.x, px, t)
      scratch.target.y = THREE.MathUtils.lerp(scratch.target.y, headHeight, t)
      scratch.target.z = THREE.MathUtils.lerp(scratch.target.z, pz, t)
    }

    // Desired camera position is computed off the SMOOTHED target — so when
    // the camera lerps toward `desired` and then looks at `target`, both
    // ends of the look vector are at the same smoothed point in space.
    scratch.desired.set(
      scratch.target.x + dist * cosP * sinY,
      scratch.target.y + dist * sinP,
      scratch.target.z + dist * cosP * cosY,
    )

    camera.position.lerp(scratch.desired, t)
    camera.lookAt(scratch.target)

    // Keep aspect in sync if window resizes.
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera
      const aspect = size.width / size.height
      if (Math.abs(persp.aspect - aspect) > 0.001) {
        persp.aspect = aspect
        persp.updateProjectionMatrix()
      }
    }
  })

  return null
}
