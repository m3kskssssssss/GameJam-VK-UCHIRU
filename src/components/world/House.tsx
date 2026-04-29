'use client'
// Stylised task house: walls, gable roof, framed door, two windows, chimney,
// porch step, signpost label, and a proximity trigger for the HUD CTA.

import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Mesh } from 'three'
import { useGameStore } from '@/hooks/useGameStore'
import type { HouseSubject } from '@/hooks/useGameStore'

const TRIGGER_RADIUS = 2.2
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
    const dz = pz - hz - 1.6 // trigger sits in front of door
    const distSq = dx * dx + dz * dz
    const isNear = distSq < TRIGGER_RADIUS_SQ
    if (isNear !== wasNear.current) {
      wasNear.current = isNear
      setNearHouse(isNear ? id : null)
    }
  })

  const triggerRef = useRef<Mesh>(null)

  // Slightly shaded versions of the body colour, generated from the hex string.
  const bodyDark = shade(colour, -0.1)
  const trim = shade(colour, -0.25)

  return (
    <group position={position}>
      {/* Foundation/porch */}
      <mesh position={[0, 0.05, 1.4]}>
        <boxGeometry args={[2.4, 0.1, 0.5]} />
        <meshLambertMaterial color="#9E9E9E" />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.4, 2.0, 2.4]} />
        <meshLambertMaterial color={colour} />
      </mesh>

      {/* Body trim band along the bottom */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[2.45, 0.18, 2.45]} />
        <meshLambertMaterial color={bodyDark} />
      </mesh>

      {/* Gable roof — triangular prism: BoxGeometry rotated would be cone, but
          a CylinderGeometry with 3 sides gives a proper gable look. */}
      <mesh position={[0, 2.55, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 2.6, 4, 1]} />
        <meshLambertMaterial color={roofColour} />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.8, 3.3, -0.6]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[0.8, 3.7, -0.6]}>
        <boxGeometry args={[0.36, 0.08, 0.36]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>

      {/* Door frame */}
      <mesh position={[0, 0.7, 1.21]}>
        <planeGeometry args={[0.78, 1.3]} />
        <meshLambertMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.65, 1.215]}>
        <planeGeometry args={[0.62, 1.2]} />
        <meshLambertMaterial color="#5D4037" side={THREE.DoubleSide} />
      </mesh>
      {/* Door knob */}
      <mesh position={[0.18, 0.7, 1.22]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#FFC107" />
      </mesh>

      {/* Left window */}
      <mesh position={[-0.78, 1.45, 1.21]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshLambertMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.78, 1.45, 1.215]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial color="#90CAF9" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.78, 1.45, 1.22]}>
        <planeGeometry args={[0.42, 0.04]} />
        <meshBasicMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.78, 1.45, 1.22]}>
        <planeGeometry args={[0.04, 0.42]} />
        <meshBasicMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>

      {/* Right window */}
      <mesh position={[0.78, 1.45, 1.21]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshLambertMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.78, 1.45, 1.215]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial color="#90CAF9" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.78, 1.45, 1.22]}>
        <planeGeometry args={[0.42, 0.04]} />
        <meshBasicMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.78, 1.45, 1.22]}>
        <planeGeometry args={[0.04, 0.42]} />
        <meshBasicMaterial color={trim} side={THREE.DoubleSide} />
      </mesh>

      {/* Welcome doormat */}
      <mesh
        position={[0, 0.07, 1.65]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.7, 0.4]} />
        <meshBasicMaterial color="#FFB347" side={THREE.DoubleSide} />
      </mesh>

      {/* Floating sign with subject name */}
      <Text
        position={[0, 4.3, 0]}
        fontSize={0.5}
        color="#1F2937"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ffffff"
        maxWidth={4}
      >
        {label}
      </Text>

      {/* Invisible trigger zone in front of the door */}
      <mesh ref={triggerRef} position={[0, 0.5, 1.6]} visible={false}>
        <sphereGeometry args={[TRIGGER_RADIUS, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

// Lighten/darken a hex colour by a factor in [-1, 1]. Used for trim and band.
function shade(hex: string, factor: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const f = Math.max(-1, Math.min(1, factor))
  const ch = (n: number) => {
    const v = f >= 0 ? n + (255 - n) * f : n * (1 + f)
    return Math.round(Math.max(0, Math.min(255, v)))
  }
  const r = ch(parseInt(m[1], 16))
  const g = ch(parseInt(m[2], 16))
  const b = ch(parseInt(m[3], 16))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`
}
