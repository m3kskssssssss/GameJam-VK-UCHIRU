'use client'
// Renders the lobby scene (extracted from for-lobby/Scene.zcomp): ground map +
// GLB props (bushes, trees, grass, doors). Same shape as MattercraftScene but
// uses the lobby-specific data file.

import { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  LOBBY_ASSET_URLS,
  LOBBY_GROUND_IMAGE,
  LOBBY_SCENE_INSTANCES,
  type LobbySceneAsset,
} from './lobby-scene-data'

const USED_ASSETS: LobbySceneAsset[] = Array.from(
  new Set(LOBBY_SCENE_INSTANCES.map((i) => i.asset)),
)

function GroundMap() {
  const tex = useTexture(LOBBY_GROUND_IMAGE.src)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh
      position={LOBBY_GROUND_IMAGE.position}
      rotation={LOBBY_GROUND_IMAGE.rotation}
      receiveShadow
    >
      <planeGeometry args={[LOBBY_GROUND_IMAGE.scale[0], LOBBY_GROUND_IMAGE.scale[1]]} />
      <meshStandardMaterial map={tex} roughness={1} metalness={0} />
    </mesh>
  )
}

interface AssetGroupProps {
  asset: LobbySceneAsset
}

function AssetGroup({ asset }: AssetGroupProps) {
  const { scene } = useGLTF(LOBBY_ASSET_URLS[asset])
  const instances = useMemo(
    () => LOBBY_SCENE_INSTANCES.filter((i) => i.asset === asset),
    [asset],
  )
  const clones = useMemo(
    () => instances.map(() => scene.clone(true)),
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

export function LobbyScene() {
  return (
    <>
      <GroundMap />
      {USED_ASSETS.map((asset) => (
        <AssetGroup key={asset} asset={asset} />
      ))}
    </>
  )
}

USED_ASSETS.forEach((a) => {
  useGLTF.preload(LOBBY_ASSET_URLS[a])
})
useTexture.preload(LOBBY_GROUND_IMAGE.src)
