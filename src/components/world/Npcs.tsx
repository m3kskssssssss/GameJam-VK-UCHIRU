'use client'
// NPC proximity zones for Grandma and Grandpa. Each NPC gets a white
// semi-transparent disc + halo ring on the ground and an Html label plaque,
// matching the style of Portals.tsx. Proximity detection updates nearNpc in
// the game store every frame.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { NPCS, type Npc } from './npcs-data'
import { useGameStore } from '@/hooks/useGameStore'

const DISC_RADIUS = 1.4
const RING_INNER = 1.45
const RING_OUTER = 1.7
const LABEL_HEIGHT = 1.4

interface NpcNodeProps {
  npc: Npc
}

function NpcNode({ npc }: NpcNodeProps) {
  const setNearNpc = useGameStore((s) => s.setNearNpc)
  const wasNear = useRef(false)
  const discRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const dx = px - npc.position[0]
    const dz = pz - npc.position[2]
    const distSq = dx * dx + dz * dz
    const isNear = distSq < npc.triggerRadius * npc.triggerRadius

    if (isNear !== wasNear.current) {
      wasNear.current = isNear
      const current = useGameStore.getState().nearNpc
      if (isNear) {
        setNearNpc(npc.kind)
      } else if (current === npc.kind) {
        setNearNpc(null)
      }
    }

    if (discRef.current) {
      const t = performance.now() / 1000
      const pulse = 1 + Math.sin(t * 2.4) * 0.05
      discRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={npc.position}>
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

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[RING_INNER, RING_OUTER, 48]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

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
          {npc.label}
        </div>
      </Html>
    </group>
  )
}

export function Npcs() {
  return (
    <>
      {NPCS.map((npc) => (
        <NpcNode key={npc.kind} npc={npc} />
      ))}
    </>
  )
}
