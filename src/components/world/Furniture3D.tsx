'use client'
// Minimal 3D primitives for catalog furniture. Placeholder visuals — kept
// small and simple so the test scene reads quickly.

import * as THREE from 'three'

export interface Furniture3DProps {
  catalogKey: string
  position: [number, number, number]
}

export function Furniture3D({ catalogKey, position }: Furniture3DProps) {
  switch (catalogKey) {
    case 'chair_simple':
      return (
        <group position={position}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.55, 0.08, 0.55]} />
            <meshLambertMaterial color="#A0522D" />
          </mesh>
          <mesh position={[0, 0.55, -0.22]}>
            <boxGeometry args={[0.55, 0.65, 0.08]} />
            <meshLambertMaterial color="#A0522D" />
          </mesh>
        </group>
      )

    case 'table_simple':
      return (
        <group position={position}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.85, 0.08, 0.7]} />
            <meshLambertMaterial color="#8D6E63" />
          </mesh>
          <mesh position={[0.32, 0.2, 0.25]}>
            <boxGeometry args={[0.08, 0.45, 0.08]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          <mesh position={[-0.32, 0.2, 0.25]}>
            <boxGeometry args={[0.08, 0.45, 0.08]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0.32, 0.2, -0.25]}>
            <boxGeometry args={[0.08, 0.45, 0.08]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          <mesh position={[-0.32, 0.2, -0.25]}>
            <boxGeometry args={[0.08, 0.45, 0.08]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
        </group>
      )

    case 'bed_simple':
      return (
        <group position={position}>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.85, 0.35, 1.3]} />
            <meshLambertMaterial color="#90CAF9" />
          </mesh>
          <mesh position={[0, 0.55, -0.55]}>
            <boxGeometry args={[0.85, 0.5, 0.08]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0, 0.42, 0.1]}>
            <boxGeometry args={[0.7, 0.05, 0.45]} />
            <meshLambertMaterial color="#FFFFFF" />
          </mesh>
        </group>
      )

    case 'lamp_classic':
      return (
        <group position={position}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 16]} />
            <meshLambertMaterial color="#212121" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
            <meshLambertMaterial color="#424242" />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <coneGeometry args={[0.22, 0.32, 12]} />
            <meshLambertMaterial color="#FFC107" emissive="#FFA000" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )

    case 'rug_warm':
      return (
        <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.95, 0.95]} />
          <meshBasicMaterial color="#E57373" side={THREE.DoubleSide} />
        </mesh>
      )

    case 'bookshelf':
      return (
        <group position={position}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.7, 1.4, 0.3]} />
            <meshLambertMaterial color="#5D4037" />
          </mesh>
          <mesh position={[-0.18, 0.5, 0.16]}>
            <boxGeometry args={[0.18, 0.25, 0.04]} />
            <meshLambertMaterial color="#E53935" />
          </mesh>
          <mesh position={[0.05, 0.5, 0.16]}>
            <boxGeometry args={[0.15, 0.22, 0.04]} />
            <meshLambertMaterial color="#43A047" />
          </mesh>
          <mesh position={[-0.05, 0.95, 0.16]}>
            <boxGeometry args={[0.2, 0.28, 0.04]} />
            <meshLambertMaterial color="#1E88E5" />
          </mesh>
        </group>
      )

    case 'tv_old':
      return (
        <group position={position}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.3]} />
            <meshLambertMaterial color="#424242" />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.95, 0.65, 0.22]} />
            <meshLambertMaterial color="#212121" />
          </mesh>
          <mesh position={[0, 0.55, 0.12]}>
            <planeGeometry args={[0.75, 0.45]} />
            <meshBasicMaterial color="#4DA8DA" />
          </mesh>
        </group>
      )

    default:
      return (
        <mesh position={[position[0], position[1] + 0.25, position[2]]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshLambertMaterial color="#9E9E9E" />
        </mesh>
      )
  }
}
