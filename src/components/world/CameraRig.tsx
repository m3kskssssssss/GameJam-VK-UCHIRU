'use client'
// Third-person follow camera (Genshin/Zelda style).
// Reads cameraYaw / cameraPitch / cameraDistance from useGameStore so any UI
// (joystick, mouse drag, keys) can drive it.
//
// Smoothing is frame-rate independent: position uses exponential decay
// (1 - exp(-rate * dt)) so the lag time is the same on 30 / 60 / 144 fps,
// instead of the old per-frame lerp(0.18) which felt sluggish at 30 fps.
// Orientation snaps directly via camera.lookAt() — pre-rewrite behaviour —
// so the framing stays exactly where the player expects it.

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

// Position lerp rate — chosen so 1 - exp(-rate / 60) ≈ 0.18, matching the
// old per-frame factor at 60 fps but staying consistent on slower devices.
const POS_RATE = 12

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
      lookAt: new THREE.Vector3(),
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

    // Frame-rate-independent position lerp.
    const posT = 1 - Math.exp(-POS_RATE * delta)
    camera.position.lerp(scratch.desired, posT)

    // Snap the camera to look at the player's head — same behaviour as
    // before the rewrite so framing matches the user's muscle memory.
    scratch.lookAt.set(px, headHeight, pz)
    camera.lookAt(scratch.lookAt)

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
