'use client'
// Entry portals at the doors of the 5 active Mattercraft houses. Each portal
// is a glowing ring on the ground + an invisible proximity sphere that updates
// store.nearHouse when the player walks onto it. A billboarded text label
// floats above the ring so the kid can read each subject name regardless of
// camera angle.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  DOOR_OFFSET,
  PORTALS,
  TRIGGER_RADIUS,
  type Portal,
} from './portals-data'
import { useGameStore } from '@/hooks/useGameStore'

// 1.5× smaller than the original draft.
const PORTAL_SCALE = 1 / 1.5
const RING_INNER = 1.6 * PORTAL_SCALE
const RING_OUTER = 2.4 * PORTAL_SCALE
const SOFT_INNER = 0.8 * PORTAL_SCALE
const SOFT_OUTER = 1.6 * PORTAL_SCALE
const LABEL_HEIGHT = 1.6
const LABEL_FONT = 0.55

interface PortalNodeProps {
  portal: Portal
}

function PortalNode({ portal }: PortalNodeProps) {
  const setNearHouse = useGameStore((s) => s.setNearHouse)
  const wasNear = useRef(false)
  const ringRef = useRef<THREE.Mesh>(null)

  // World-space portal position: rotate a unit +Z vector by offsetDirection
  // and add to the house position.
  const portalPos = useMemo<[number, number, number]>(() => {
    const [hx, , hz] = portal.housePosition
    const sin = Math.sin(portal.offsetDirection)
    const cos = Math.cos(portal.offsetDirection)
    return [hx + sin * DOOR_OFFSET, 0.05, hz + cos * DOOR_OFFSET]
  }, [portal])

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const dx = px - portalPos[0]
    const dz = pz - portalPos[2]
    const distSq = dx * dx + dz * dz
    const isNear = distSq < TRIGGER_RADIUS * TRIGGER_RADIUS

    if (isNear !== wasNear.current) {
      wasNear.current = isNear
      const current = useGameStore.getState().nearHouse
      if (isNear) {
        setNearHouse(portal.subject)
      } else if (current === portal.subject) {
        setNearHouse(null)
      }
    }

    // Gentle pulse on the outer ring.
    if (ringRef.current) {
      const t = performance.now() / 1000
      const pulse = 1 + Math.sin(t * 2.4) * 0.06
      ringRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={portalPos}>
      {/* Glowing outer ring on the ground */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[RING_INNER, RING_OUTER, 48]} />
        <meshBasicMaterial
          color={portal.color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner softer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[SOFT_INNER, SOFT_OUTER, 48]} />
        <meshBasicMaterial
          color={portal.color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Billboarded label — always faces the camera so it's readable from any angle */}
      <Billboard follow position={[0, LABEL_HEIGHT, 0]}>
        <Text
          fontSize={LABEL_FONT}
          color="#1F2937"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#FFFFFF"
          maxWidth={6}
        >
          {portal.label}
        </Text>
      </Billboard>
    </group>
  )
}

export function Portals() {
  return (
    <>
      {PORTALS.map((portal) => (
        <PortalNode key={portal.subject} portal={portal} />
      ))}
    </>
  )
}
