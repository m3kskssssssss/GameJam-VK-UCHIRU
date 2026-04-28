'use client'
// Task 6.9 — Billboard pet sprite for the room grid.
// Renders a small animated SVG sprite in the bottom-right of RoomGrid.

import Image from 'next/image'
import { getCatalogItem } from '@/server/content/catalog'

// ---- Types ------------------------------------------------------------------

export interface PetSpriteProps {
  petKey: string
}

// ---- Sprite mapping ---------------------------------------------------------

const PET_SPRITE_MAP: Record<string, string> = {
  cat: '/sprites/pets/cat.svg',
  dog: '/sprites/pets/dog.svg',
  dragon: '/sprites/pets/dragon.svg',
}

// ---- Component --------------------------------------------------------------

export function PetSprite({ petKey }: PetSpriteProps) {
  const src = PET_SPRITE_MAP[petKey]
  if (!src) return null

  const catalogItem = getCatalogItem(petKey)
  const label = catalogItem?.name ?? petKey

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '0.5rem',
        right: '0.5rem',
        zIndex: 10,
        pointerEvents: 'none',
        width: 56,
        height: 56,
      }}
      title={label}
      aria-label={label}
      role="img"
    >
      <Image
        src={src}
        alt={label}
        width={56}
        height={56}
        className="animate-[float_2s_ease-in-out_infinite]"
        style={{ imageRendering: 'pixelated' }}
        priority={false}
      />
    </div>
  )
}
