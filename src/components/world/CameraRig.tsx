'use client'
// Third-person follow camera (Genshin/Zelda style).
// Reads cameraYaw / cameraPitch / cameraDistance from useGameStore so any UI
// (joystick, mouse drag, keys) can drive it.

import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

const POS_LERP = 0.18
const _LOOK_LERP = 0.22

const _desired = new THREE.Vector3()
const _lookAt = new THREE.Vector3()
const _currentLook = new THREE.Vector3()

interface Props {
  /** Override the in-store camera distance for this scene. */
  distance?: number
  /** Where the camera looks (above ground), in world units above the player. */
  headHeight?: number
}

export function CameraRig({ distance, headHeight = 0.9 }: Props = {}) {
  const { camera, size } = useThree()

  useFrame(() => {
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
    _desired.set(
      px + dist * cosP * sinY,
      headHeight + dist * sinP,
      pz + dist * cosP * cosY,
    )

    camera.position.lerp(_desired, POS_LERP)

    _lookAt.set(px, headHeight, pz)
    _currentLook.copy(camera.getWorldDirection(new THREE.Vector3())).multiplyScalar(1)
    camera.lookAt(_lookAt)

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
