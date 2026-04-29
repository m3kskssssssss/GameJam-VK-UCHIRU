'use client'
// Orthographic camera that lerps to follow the character.
// Camera angle: slightly isometric. Zoom and offset configurable per scene.

import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

const LERP_FACTOR = 0.1

interface CameraRigProps {
  zoomMobile?: number
  zoomDesktop?: number
  offset?: [number, number, number]
  lookAtY?: number
}

const _target = new THREE.Vector3()
const _desired = new THREE.Vector3()
const _offset = new THREE.Vector3()

export function CameraRig({
  zoomMobile = 68,
  zoomDesktop = 88,
  offset = [0, 14, 10],
  lookAtY = 0.5,
}: CameraRigProps = {}) {
  const { camera, size } = useThree()
  _offset.set(offset[0], offset[1], offset[2])

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position

    _target.set(px, 0, pz)
    _desired.copy(_target).add(_offset)
    camera.position.lerp(_desired, LERP_FACTOR)

    _target.y = lookAtY
    camera.lookAt(_target)

    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const ortho = camera as THREE.OrthographicCamera
      const isMobile = size.width < 768
      const zoom = isMobile ? zoomMobile : zoomDesktop
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
