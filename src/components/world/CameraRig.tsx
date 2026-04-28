'use client'
// Orthographic camera that lerps to follow the character.
// Camera angle: slightly isometric (~45° from ground).

import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

const LERP_FACTOR = 0.1

// Camera offset from character (gives isometric feel)
const CAM_OFFSET = new THREE.Vector3(0, 14, 10)

const _target = new THREE.Vector3()
const _desired = new THREE.Vector3()

export function CameraRig() {
  const { camera, size } = useThree()

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position

    _target.set(px, 0, pz)
    _desired.copy(_target).add(CAM_OFFSET)

    // Lerp camera position toward desired
    camera.position.lerp(_desired, LERP_FACTOR)

    // Always look at character position (slightly above ground)
    _target.y = 0.5
    camera.lookAt(_target)

    // Adjust orthographic frustum for viewport aspect
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const ortho = camera as THREE.OrthographicCamera
      const isMobile = size.width < 768
      // Narrower zoom on mobile so the world feels bigger relative to screen
      const zoom = isMobile ? 28 : 38
      const aspect = size.width / size.height
      ortho.left = -zoom * aspect
      ortho.right = zoom * aspect
      ortho.top = zoom
      ortho.bottom = -zoom
      ortho.updateProjectionMatrix()
    }
  })

  return null
}
