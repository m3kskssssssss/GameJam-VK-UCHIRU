'use client'
// Shared lighting rig for all 3D scenes (play / lobby / home interior).
// One overhead directional light casts soft shadows down onto the ground
// (and across the props), with a frustum sized to the playable tile so the
// shadow map stays sharp without bloating the texture. Hemisphere + ambient
// keep the unlit faces from going pitch-black.
//
// The Canvas in each scene must enable shadows (e.g. shadows="soft") for
// the directional light's `castShadow` to take effect.

interface Props {
  /** Side length of the playable area — drives the shadow camera frustum. */
  size: number
  /** Indoor scenes (the home) want gentler ambient + softer light. */
  indoor?: boolean
}

export function SceneLights({ size, indoor = false }: Props) {
  // Push the light high and slightly south-east so shadows fall toward the
  // player's south, which is the camera's default "in front of" direction.
  const lightX = size * 0.4
  const lightY = size * 0.9
  const lightZ = size * 0.3

  // Frustum half-size — must contain everything that should cast shadows.
  // 1.1× the central tile size lets the player at the very edge still cast.
  const half = size * 0.55

  return (
    <>
      <ambientLight intensity={indoor ? 0.55 : 0.45} />
      <hemisphereLight
        args={[indoor ? '#fff7e6' : '#dfefff', indoor ? '#e7d8b5' : '#5b8a6a', 0.45]}
      />
      <directionalLight
        castShadow
        position={[lightX, lightY, lightZ]}
        intensity={indoor ? 0.85 : 1.05}
        color={indoor ? '#fff3d6' : '#ffffff'}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-near={1}
        shadow-camera-far={lightY * 2 + size}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
      />
    </>
  )
}
