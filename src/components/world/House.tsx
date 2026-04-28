'use client'
// Reusable stylised house: cube body + cone roof + Text label + trigger zone.

import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { useGameStore } from '@/hooks/useGameStore'
import type { HouseSubject } from '@/hooks/useGameStore'

const TRIGGER_RADIUS = 1.5
const TRIGGER_RADIUS_SQ = TRIGGER_RADIUS * TRIGGER_RADIUS

interface HouseProps {
  id: HouseSubject
  position: [number, number, number]
  colour: string
  roofColour: string
  label: string
}

export function House({ id, position, colour, roofColour, label }: HouseProps) {
  const setNearHouse = useGameStore((s) => s.setNearHouse)
  const wasNear = useRef(false)

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const [hx, , hz] = position

    const dx = px - hx
    const dz = pz - hz
    const distSq = dx * dx + dz * dz

    const isNear = distSq < TRIGGER_RADIUS_SQ

    if (isNear !== wasNear.current) {
      wasNear.current = isNear
      setNearHouse(isNear ? id : null)
    }
  })

  // Trigger zone ref (invisible — just for debugging in dev if needed)
  const triggerRef = useRef<Mesh>(null)

  return (
    <group position={position}>
      {/* House body */}
      <mesh position={[0, 0.75, 0]} castShadow={false}>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshLambertMaterial color={colour} />
      </mesh>

      {/* Roof (cone) */}
      <mesh position={[0, 1.9, 0]} castShadow={false}>
        <coneGeometry args={[1.5, 1.2, 4]} />
        <meshLambertMaterial color={roofColour} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.4, 1.01]} castShadow={false}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>

      {/* Label above roof */}
      <Text
        position={[0, 3.2, 0]}
        fontSize={0.45}
        color="#1F2937"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#ffffff"
        maxWidth={3}
      >
        {label}
      </Text>

      {/* Invisible trigger zone around the door (front-centre) */}
      <mesh
        ref={triggerRef}
        position={[0, 0.5, 1.5]}
        visible={false}
      >
        <sphereGeometry args={[TRIGGER_RADIUS, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
