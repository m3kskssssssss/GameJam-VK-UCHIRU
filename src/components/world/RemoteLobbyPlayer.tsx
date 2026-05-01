'use client'
// Renders one remote player in the lobby — same Meshy biped as the local
// CharacterGLB, but driven by polled snapshots (x, z, yaw, vx, vz, isRunning,
// isJumping). Smoothness is achieved by velocity-extrapolating the server
// snapshot forward in time and lerping the rendered transform toward that
// predicted target each frame, so movement looks continuous between polls
// (~500 ms) instead of stair-stepping.
//
// A billboarded nameplate (rounded black pill, white text, small size) floats
// above the head — same on phone and desktop.

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html, useAnimations, useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

const PATHS = {
  BOY: { mesh: '/characters/boy.glb', anim: '/characters/boy_animations.glb' },
  GIRL: { mesh: '/characters/girl.glb', anim: '/characters/girl_animations.glb' },
} as const

type Gender = keyof typeof PATHS

export interface RemoteSnapshot {
  x: number
  z: number
  yaw: number
  vx: number
  vz: number
  isRunning: boolean
  isJumping: boolean
  /** performance.now() when this snapshot was applied locally. */
  receivedAtMs: number
}

interface Props {
  displayName: string
  gender: Gender
  /** Latest snapshot from the server (already adjusted to the local clock).
   *  The component reads from a ref-like object, so updating the same object
   *  in place works — but we expect a new object per poll for React to
   *  trigger props update. */
  snapshot: RemoteSnapshot
}

// How far into the future we extrapolate from the snapshot. Keep small —
// otherwise short network blips cause noticeable overshoot.
const MAX_EXTRAPOLATION_MS = 1500

// Vertical offset for jumping animation (no real physics — just a quick arc
// for visual feedback while server reports isJumping).
const JUMP_HEIGHT = 0.6

export function RemoteLobbyPlayer({ displayName, gender, snapshot }: Props) {
  const paths = PATHS[gender]
  const groupRef = useRef<THREE.Group>(null)
  const characterRef = useRef<THREE.Group>(null)

  // Latest snapshot — kept in a ref so useFrame always sees the freshest props.
  const snapRef = useRef<RemoteSnapshot>(snapshot)
  snapRef.current = snapshot

  // Smoothed render state. Initialised lazily on first frame so we don't
  // teleport from the origin.
  const renderRef = useRef<{
    initialised: boolean
    x: number
    z: number
    y: number
    yaw: number
  }>({ initialised: false, x: snapshot.x, z: snapshot.z, y: 0, yaw: snapshot.yaw })

  const meshGltf = useGLTF(paths.mesh)
  const animGltf = useGLTF(paths.anim)

  const cloned = useMemo(() => {
    const c = skeletonClone(meshGltf.scene) as THREE.Object3D
    c.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = false
        // Match CharacterGLB: tone down albedo + kill any emissive so the
        // remote players don't look "lit from within" against the scene.
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | THREE.MeshStandardMaterial[]
        const dim = (m: THREE.Material) => {
          const std = m as THREE.MeshStandardMaterial
          if (std.userData?.kqDimmed) return
          std.userData = { ...std.userData, kqDimmed: true }
          if (std.color) std.color.multiplyScalar(0.89)
          if (std.emissive) std.emissive.setScalar(0)
          if ('emissiveIntensity' in std) std.emissiveIntensity = 0
        }
        if (Array.isArray(mat)) mat.forEach(dim)
        else dim(mat)
      }
    })
    return c
  }, [meshGltf.scene])

  const { actions } = useAnimations(animGltf.animations, cloned)

  // Start both clips paused — switch on/off via timeScale + weight.
  useEffect(() => {
    const walking = actions.Walking
    const running = actions.Running
    if (walking) {
      walking.reset()
      walking.play()
      walking.timeScale = 0
      walking.weight = 1
    }
    if (running) {
      running.reset()
      running.play()
      running.timeScale = 0
      running.weight = 0
    }
  }, [actions])

  useFrame((_, delta) => {
    const g = groupRef.current
    const c = characterRef.current
    if (!g || !c) return

    const snap = snapRef.current
    const now = performance.now()

    // Extrapolate the server snapshot forward by the time elapsed since it
    // was applied. Velocity is in world units per second.
    const elapsedMs = Math.min(MAX_EXTRAPOLATION_MS, Math.max(0, now - snap.receivedAtMs))
    const elapsedS = elapsedMs / 1000
    const predX = snap.x + snap.vx * elapsedS
    const predZ = snap.z + snap.vz * elapsedS

    // First frame: snap to predicted target so we don't slide in from origin.
    const r = renderRef.current
    if (!r.initialised) {
      r.x = predX
      r.z = predZ
      r.yaw = snap.yaw
      r.initialised = true
    }

    // Lerp position toward predicted target. Faster lerp when the gap is
    // bigger so we never stay too far behind, slower when close so it feels
    // smooth.
    const dx = predX - r.x
    const dz = predZ - r.z
    const lerp = Math.min(1, delta * 10)
    r.x += dx * lerp
    r.z += dz * lerp

    // Jump arc — short visual hop while isJumping is true on the snapshot.
    const targetY = snap.isJumping ? JUMP_HEIGHT : 0
    r.y += (targetY - r.y) * Math.min(1, delta * 10)

    // Yaw — shortest-path lerp toward the snapshot's yaw.
    let yawDiff = snap.yaw - r.yaw
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2
    r.yaw += yawDiff * Math.min(1, delta * 10)

    g.position.set(r.x, r.y, r.z)
    c.rotation.y = r.yaw

    // Animation: walking vs running based on movement state. Movement is
    // determined from the snapshot's velocity (more reliable than
    // re-deriving from the lerped position).
    const walking = actions.Walking
    const running = actions.Running
    const speedSq = snap.vx * snap.vx + snap.vz * snap.vz
    const isMoving = speedSq > 0.01
    if (walking && running) {
      if (!isMoving) {
        walking.timeScale = 0
        walking.time = 0
        walking.weight = 1
        running.weight = 0
      } else if (snap.isRunning) {
        walking.weight = 0
        running.weight = 1
        running.timeScale = 1
      } else {
        walking.weight = 1
        walking.timeScale = 1
        running.weight = 0
      }
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={characterRef}>
        <primitive object={cloned} />
      </group>
      <Billboard follow position={[0, 2.4, 0]}>
        <Html center distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(15,23,42,0.85)',
              color: '#FFFFFF',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              userSelect: 'none',
            }}
          >
            {displayName}
          </div>
        </Html>
      </Billboard>
    </group>
  )
}

useGLTF.preload(PATHS.BOY.mesh)
useGLTF.preload(PATHS.BOY.anim)
useGLTF.preload(PATHS.GIRL.mesh)
useGLTF.preload(PATHS.GIRL.anim)
