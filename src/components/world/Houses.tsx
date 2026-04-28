'use client'
// Composes all 5 houses per docs/GAME_DESIGN.md layout.

import { memo } from 'react'
import { House } from './House'
import type { HouseSubject } from '@/hooks/useGameStore'

interface HouseConfig {
  id: HouseSubject
  position: [number, number, number]
  colour: string
  roofColour: string
  label: string
}

// House colours mapped from docs/DESIGN_SYSTEM.md tokens
// math=primary blue, reading=success green, english=accent yellow, pe=destructive coral, home=neutral
const HOUSES: HouseConfig[] = [
  {
    id: 'home',
    position: [0, 0, -8],
    colour: '#B0BEC5',   // neutral blue-grey
    roofColour: '#78909C',
    label: 'Дом',
  },
  {
    id: 'math',
    position: [-7, 0, -3],
    colour: '#4DA8DA',   // primary blue
    roofColour: '#2980B9',
    label: 'Математика',
  },
  {
    id: 'reading',
    position: [-7, 0, 3],
    colour: '#6BCB77',   // success green
    roofColour: '#43A047',
    label: 'Чтение',
  },
  {
    id: 'english',
    position: [7, 0, -3],
    colour: '#FFB347',   // accent yellow
    roofColour: '#FB8C00',
    label: 'Английский',
  },
  {
    id: 'pe',
    position: [7, 0, 3],
    colour: '#FF6B6B',   // destructive coral
    roofColour: '#E53935',
    label: 'Физкультура',
  },
]

export const Houses = memo(function Houses() {
  return (
    <>
      {HOUSES.map((h) => (
        <House
          key={h.id}
          id={h.id}
          position={h.position}
          colour={h.colour}
          roofColour={h.roofColour}
          label={h.label}
        />
      ))}
    </>
  )
})
