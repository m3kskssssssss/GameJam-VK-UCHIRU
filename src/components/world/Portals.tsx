'use client'
// Entry portals at the doors of the 5 active Mattercraft houses. Each portal
// is a white semi-transparent disc on the ground (+ soft halo ring) and an
// Html label plaque that always faces the camera. An invisible proximity check
// updates store.nearHouse when the player walks onto it.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  DOOR_OFFSET,
  PORTALS,
  TRIGGER_RADIUS,
  type Portal,
} from './portals-data'
import { useGameStore } from '@/hooks/useGameStore'

// White disc dimensions (world units)
const DISC_RADIUS = 1.4
const RING_INNER = 1.45
const RING_OUTER = 1.7
const LABEL_HEIGHT = 2.24

interface PortalNodeProps {
  portal: Portal
}

function PortalNode({ portal }: PortalNodeProps) {
  const setNearHouse = useGameStore((s) => s.setNearHouse)
  const wasNear = useRef(false)
  const discRef = useRef<THREE.Mesh>(null)

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

    // Gentle pulse on the disc (±5%).
    if (discRef.current) {
      const t = performance.now() / 1000
      const pulse = 1 + Math.sin(t * 2.4) * 0.05
      discRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={portalPos}>
      {/* White semi-transparent disc flat on XZ plane */}
      <mesh
        ref={discRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <circleGeometry args={[DISC_RADIUS, 48]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Soft halo ring around the disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[RING_INNER, RING_OUTER, 48]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Html label — always faces camera, styled as a white rounded plaque */}
      <Html
        center
        distanceFactor={8}
        sprite
        position={[0, LABEL_HEIGHT, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            borderRadius: 14,
            background: 'rgba(255,255,255,0.95)',
            boxShadow:
              '0 8px 24px rgba(31,41,55,0.18), 0 2px 8px rgba(31,41,55,0.10)',
            padding: '8px 18px',
            font: '800 16px/1.1 Nunito, sans-serif',
            color: '#1F2937',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {portal.label}
        </div>
      </Html>
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
