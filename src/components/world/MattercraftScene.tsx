'use client'
// Renders the Mattercraft-exported scene: ground map + GLB props (houses, fences,
// trees, bushes, grass, pumpkins, berries, playgrounds). Transforms come from
// scripts/extract-scene.ts → mattercraft-scene-data.ts.

import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  ASSET_URLS,
  GROUND_IMAGE,
  SCENE_INSTANCES,
  type SceneAsset,
} from './mattercraft-scene-data'

// All assets we actually load — filtered to ones that have at least one instance,
// to avoid pre-fetching unused GLBs (e.g. Tree_Classic if not used).
const USED_ASSETS: SceneAsset[] = Array.from(
  new Set(SCENE_INSTANCES.map((i) => i.asset)),
)

function GroundMap() {
  const tex = useTexture(GROUND_IMAGE.src)
  // Keep image colors faithful (Mattercraft uses the PNG as a flat ground).
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh
      position={GROUND_IMAGE.position}
      rotation={GROUND_IMAGE.rotation}
      receiveShadow
    >
      <planeGeometry args={[GROUND_IMAGE.scale[0], GROUND_IMAGE.scale[1]]} />
      <meshStandardMaterial map={tex} roughness={1} metalness={0} />
    </mesh>
  )
}

interface AssetGroupProps {
  asset: SceneAsset
}

function AssetGroup({ asset }: AssetGroupProps) {
  const { scene } = useGLTF(ASSET_URLS[asset])
  const instances = useMemo(
    () => SCENE_INSTANCES.filter((i) => i.asset === asset),
    [asset],
  )

  // Clone once per instance — drei's <Clone> can't deep-share skinned meshes,
  // but our props are plain meshes so simple Object3D.clone() with shared
  // geometry/materials is cheapest. Each clone gets castShadow=true so the
  // overhead directional light can drop its silhouette onto the ground.
  const clones = useMemo(
    () =>
      instances.map(() => {
        const c = scene.clone(true)
        c.traverse((child) => {
          const mesh = child as THREE.Mesh
          if (mesh.isMesh) {
            mesh.castShadow = true
            mesh.receiveShadow = true
          }
        })
        return c
      }),
    [instances, scene],
  )

  return (
    <>
      {instances.map((inst, idx) => (
        <primitive
          key={inst.label}
          object={clones[idx]}
          position={inst.position}
          rotation={inst.rotation}
          scale={inst.scale}
        />
      ))}
    </>
  )
}

export function MattercraftScene() {
  return (
    <>
      <GroundMap />
      {USED_ASSETS.map((asset) => (
        <AssetGroup key={asset} asset={asset} />
      ))}
    </>
  )
}

// Preload all used GLBs to avoid pop-in on first render.
USED_ASSETS.forEach((a) => {
  useGLTF.preload(ASSET_URLS[a])
})
useTexture.preload(GROUND_IMAGE.src)
