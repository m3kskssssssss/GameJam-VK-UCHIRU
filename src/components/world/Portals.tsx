'use client'
// Entry portals at the doors of the 5 active Mattercraft houses. Each portal
// is a glowing ring on the ground + an invisible proximity sphere that updates
// store.nearHouse when the player walks onto the porch.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  DOOR_OFFSET,
  PORTALS,
  TRIGGER_RADIUS,
  type Portal,
} from './portals-data'
import { useGameStore } from '@/hooks/useGameStore'

interface PortalNodeProps {
  portal: Portal
}

function PortalNode({ portal }: PortalNodeProps) {
  const setNearHouse = useGameStore((s) => s.setNearHouse)
  const wasNear = useRef(false)
  const ringRef = useRef<THREE.Mesh>(null)

  // World-space door position: rotate local +Z offset by yaw, add to house pos.
  const doorPos = useMemo<[number, number, number]>(() => {
    const [hx, , hz] = portal.housePosition
    const sin = Math.sin(portal.houseYaw)
    const cos = Math.cos(portal.houseYaw)
    // local +Z = forward through the door. After yaw: (sin*offset, ?, cos*offset).
    return [hx + sin * DOOR_OFFSET, 0.05, hz + cos * DOOR_OFFSET]
  }, [portal])

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const dx = px - doorPos[0]
    const dz = pz - doorPos[2]
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

    // Gentle pulse on the ring.
    if (ringRef.current) {
      const t = performance.now() / 1000
      const pulse = 1 + Math.sin(t * 2.4) * 0.06
      ringRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={doorPos}>
      {/* Glowing ring on the ground */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.6, 2.4, 48]} />
        <meshBasicMaterial
          color={portal.color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner softer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.8, 1.6, 48]} />
        <meshBasicMaterial
          color={portal.color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
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
