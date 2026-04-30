'use client'
// 3D interior scene for /play/home.
// Photo-textured floor, walls, door, placed furniture, animated 3D character
// (same Meshy biped used in the outdoor /play world). Walls fade out when
// they're between the camera and the player so the rotated camera angle
// never blocks the action.

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CharacterGLB, type CharacterGender } from './CharacterGLB'
import { CameraRig } from './CameraRig'
import { Joystick } from './Joystick'
import { RotationJoystick } from './RotationJoystick'
import { Furniture3D } from './Furniture3D'
import { useGameStore } from '@/hooks/useGameStore'
import { useSceneInput } from '@/hooks/useSceneInput'
import type { RoomPlacementSummary } from '@/server/actions/rooms'

const COLS = 8
const ROWS = 6
const CELL = 1
const FLOOR_W = COLS * CELL
const FLOOR_D = ROWS * CELL
const WALL_H = 2.6
const WALL_T = 0.18

interface Props {
  placements: RoomPlacementSummary[]
  gender: CharacterGender
  onExit: () => void
}

// ── Wall — own its own material ref so the scene can fade it on demand ─────

interface WallSpec {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

function FadeWall({
  spec,
  registerRef,
}: {
  spec: WallSpec
  registerRef: (id: string, ref: THREE.MeshLambertMaterial | null) => void
}) {
  const matRef = useRef<THREE.MeshLambertMaterial | null>(null)
  useEffect(() => {
    registerRef(spec.id, matRef.current)
    return () => registerRef(spec.id, null)
  }, [spec.id, registerRef])

  return (
    <mesh position={spec.position}>
      <boxGeometry args={spec.size} />
      <meshLambertMaterial
        ref={matRef}
        color={spec.color}
        transparent
        opacity={1}
      />
    </mesh>
  )
}

// ── Indoor scene ────────────────────────────────────────────────────────────

const HALF_W = FLOOR_W / 2
const HALF_D = FLOOR_D / 2

const WALL_SPECS: WallSpec[] = [
  // Back
  {
    id: 'back',
    position: [0, WALL_H / 2, -HALF_D - WALL_T / 2],
    size: [FLOOR_W + WALL_T * 2, WALL_H, WALL_T],
    color: '#FAEDCD',
  },
  // Left
  {
    id: 'left',
    position: [-HALF_W - WALL_T / 2, WALL_H / 2, 0],
    size: [WALL_T, WALL_H, FLOOR_D],
    color: '#F5E1B4',
  },
  // Right
  {
    id: 'right',
    position: [HALF_W + WALL_T / 2, WALL_H / 2, 0],
    size: [WALL_T, WALL_H, FLOOR_D],
    color: '#F5E1B4',
  },
  // Front-left of door
  {
    id: 'frontL',
    position: [-(HALF_W / 2 + 0.6), WALL_H / 2, HALF_D + WALL_T / 2],
    size: [HALF_W - 1.2, WALL_H, WALL_T],
    color: '#FAEDCD',
  },
  // Front-right of door
  {
    id: 'frontR',
    position: [HALF_W / 2 + 0.6, WALL_H / 2, HALF_D + WALL_T / 2],
    size: [HALF_W - 1.2, WALL_H, WALL_T],
    color: '#FAEDCD',
  },
  // Lintel above the door
  {
    id: 'lintel',
    position: [0, WALL_H - 0.25, HALF_D + WALL_T / 2],
    size: [2.4, 0.5, WALL_T],
    color: '#FAEDCD',
  },
]

function IndoorScene({
  placements,
  registerWallRef,
}: {
  placements: RoomPlacementSummary[]
  registerWallRef: (id: string, ref: THREE.MeshLambertMaterial | null) => void
}) {
  const floorTex = useTexture('/textures/pol-home.png')
  floorTex.wrapS = THREE.RepeatWrapping
  floorTex.wrapT = THREE.RepeatWrapping
  // Tile the photo so it doesn't stretch into a single mega-plank across the room.
  floorTex.repeat.set(2, Math.max(1, Math.round((2 * FLOOR_D) / FLOOR_W)))
  floorTex.colorSpace = THREE.SRGBColorSpace
  floorTex.anisotropy = 8

  return (
    <group>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 10, 5]} intensity={0.55} />
      <hemisphereLight color="#ffffff" groundColor="#f4f0e6" intensity={0.4} />

      {/* Floor — uses the photo from /textures/pol-home.png */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshStandardMaterial map={floorTex} roughness={0.95} metalness={0} />
      </mesh>

      {/* Walls + lintel */}
      {WALL_SPECS.map((spec) => (
        <FadeWall key={spec.id} spec={spec} registerRef={registerWallRef} />
      ))}

      {/* Door panel + knob */}
      <mesh position={[0, 1.0, HALF_D + 0.01]}>
        <planeGeometry args={[1.6, 2.0]} />
        <meshBasicMaterial color="#5D4037" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.45, 1.0, HALF_D + 0.02]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#FFC107" />
      </mesh>

      {/* Welcome rug */}
      <mesh
        position={[0, 0.01, HALF_D - 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.4, 0.6]} />
        <meshBasicMaterial color="#FFB347" side={THREE.DoubleSide} />
      </mesh>

      {/* Placed furniture */}
      {placements.map((p) => {
        const wx = p.x - (COLS - 1) / 2
        const wz = p.y - (ROWS - 1) / 2
        return (
          <Furniture3D key={p.id} catalogKey={p.catalogKey} position={[wx, 0, wz]} />
        )
      })}
    </group>
  )
}

// ── Door trigger ───────────────────────────────────────────────────────────

function DoorTrigger({ onSetNear }: { onSetNear: (b: boolean) => void }) {
  const wasNear = useRef(false)
  useFrame(() => {
    const [px, , pz] = useGameStore.getState().position
    const near = pz > HALF_D - 1.2 && Math.abs(px) < 1.0
    if (near !== wasNear.current) {
      wasNear.current = near
      onSetNear(near)
    }
  })
  return null
}

// ── Wall fade controller — runs inside the Canvas ──────────────────────────
//
// For each wall, decide whether the segment from the camera to the player
// passes through that wall. If yes, lerp opacity down so the player stays
// visible from any rotated camera angle.

function WallFadeController({
  wallRefs,
}: {
  wallRefs: React.MutableRefObject<Record<string, THREE.MeshLambertMaterial | null>>
}) {
  const camToPlayer = useRef(new THREE.Vector3())
  const camToWall = useRef(new THREE.Vector3())
  const projVec = useRef(new THREE.Vector3())
  const lateral = useRef(new THREE.Vector3())

  useFrame((threeState) => {
    const { camera } = threeState
    const [px, py, pz] = useGameStore.getState().position

    camToPlayer.current.set(px - camera.position.x, py + 0.6 - camera.position.y, pz - camera.position.z)
    const playerDist = camToPlayer.current.length()
    if (playerDist < 0.001) return
    const playerDir = camToPlayer.current.clone().normalize()

    for (const spec of WALL_SPECS) {
      const mat = wallRefs.current[spec.id]
      if (!mat) continue

      camToWall.current.set(
        spec.position[0] - camera.position.x,
        spec.position[1] - camera.position.y,
        spec.position[2] - camera.position.z,
      )
      const projection = camToWall.current.dot(playerDir)
      let target = 1
      if (projection > 0 && projection < playerDist) {
        // Compute lateral distance from the camera-to-player line.
        projVec.current.copy(playerDir).multiplyScalar(projection)
        lateral.current.copy(camToWall.current).sub(projVec.current)
        const lateralDist = lateral.current.length()
        // Use a generous lateral threshold tied to the longer wall axis.
        const halfSpan = Math.max(spec.size[0], spec.size[2]) / 2
        if (lateralDist < halfSpan + 0.4) {
          target = 0.18
        }
      }
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, 0.18)
      mat.transparent = true
      // Hide back-face writing so the see-through wall doesn't z-fight.
      mat.depthWrite = mat.opacity > 0.85
    }
  })

  return null
}

// ── Wrapper component ──────────────────────────────────────────────────────

export function HouseInterior({ placements, gender, onExit }: Props) {
  const setPosition = useGameStore((s) => s.setPosition)
  const setBounds = useGameStore((s) => s.setBounds)
  const setCameraDistance = useGameStore((s) => s.setCameraDistance)
  const setCameraPitch = useGameStore((s) => s.setCameraPitch)
  const setCameraYaw = useGameStore((s) => s.setCameraYaw)
  const [nearExit, setNearExit] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wallRefs = useRef<Record<string, THREE.MeshLambertMaterial | null>>({})

  const registerWallRef = (id: string, ref: THREE.MeshLambertMaterial | null) => {
    wallRefs.current[id] = ref
  }

  useEffect(() => {
    const halfW = FLOOR_W / 2 - 0.5
    const halfD = FLOOR_D / 2 - 0.5
    setBounds(halfW, halfD)
    setPosition(0, 0, halfD - 1.0)
    setCameraDistance(7)
    setCameraPitch(0.7)
    setCameraYaw(0)
  }, [setBounds, setPosition, setCameraDistance, setCameraPitch, setCameraYaw])

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  useSceneInput(containerRef)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        width: '100%',
        background: '#FAEDCD',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <Canvas
        camera={{
          position: [0, 6, 7],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ background: '#FAEDCD' }}
      >
        <CameraRig headHeight={0.9} />
        <IndoorScene placements={placements} registerWallRef={registerWallRef} />
        <WallFadeController wallRefs={wallRefs} />
        <DoorTrigger onSetNear={setNearExit} />
        <CharacterGLB gender={gender} />
      </Canvas>

      {nearExit && (
        <div
          style={{
            position: 'absolute',
            bottom: '5.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={onExit}
            style={{
              padding: '0.95rem 2.2rem',
              background: '#4DA8DA',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Nunito, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(77,168,218,0.45)',
              letterSpacing: '0.01em',
            }}
          >
            Выйти из дома
          </button>
        </div>
      )}

      {isTouchDevice && (
        <>
          <Joystick />
          <RotationJoystick />
        </>
      )}
    </div>
  )
}
