'use client'
// Third-person follow camera (Genshin/Zelda style).
// Reads cameraYaw / cameraPitch / cameraDistance from useGameStore so any UI
// (joystick, mouse drag, keys) can drive it.
//
// Smoothing is frame-rate independent: we use exponential decay
// (1 - exp(-rate * dt)) for both position and orientation. Position lerps
// toward the desired offset behind the player; orientation slerps toward a
// target quaternion built from a temporary "lookAt" object — avoids the
// camera-lookAt() snap that used to amplify any positional jitter.

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

// Tunables — higher = snappier, lower = smoother. Both are in 1/seconds.
const POS_RATE = 9
const LOOK_RATE = 12

interface Props {
  /** Override the in-store camera distance for this scene. */
  distance?: number
  /** Where the camera looks (above ground), in world units above the player. */
  headHeight?: number
}

export function CameraRig({ distance, headHeight = 0.9 }: Props = {}) {
  const { camera, size } = useThree()

  // Per-rig scratch objects so we don't allocate on every frame.
  const scratch = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      lookAt: new THREE.Vector3(),
      dummy: new THREE.Object3D(),
    }),
    [],
  )

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

    // Camera at +Z when yaw=0 (south of player) — reading "behind player" as
    // +Z so pressing Up (forward, -Z) moves player away from the camera.
    scratch.desired.set(
      px + dist * cosP * sinY,
      headHeight + dist * sinP,
      pz + dist * cosP * cosY,
    )

    // Frame-rate-independent exponential smoothing: lerp factor is
    // 1 - exp(-rate * dt), so smoothing time depends on real-world seconds
    // rather than on how many frames we got.
    const posT = 1 - Math.exp(-POS_RATE * delta)
    camera.position.lerp(scratch.desired, posT)

    // Orientation: slerp camera quaternion toward a target one built from a
    // dummy that looks at the player's head. Avoids the per-frame snap of
    // camera.lookAt() which used to amplify any jitter on the position lerp.
    scratch.lookAt.set(px, headHeight, pz)
    scratch.dummy.position.copy(camera.position)
    scratch.dummy.up.copy(camera.up)
    scratch.dummy.lookAt(scratch.lookAt)
    const lookT = 1 - Math.exp(-LOOK_RATE * delta)
    camera.quaternion.slerp(scratch.dummy.quaternion, lookT)

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
