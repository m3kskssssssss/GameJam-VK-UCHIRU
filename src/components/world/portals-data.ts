// Active "portal" houses inside the Mattercraft scene. One instance per color
// is the entry trigger to a mini-game (or the home interior).
//
// Coordinates are taken from SCENA/Scene.zcomp. Subject mapping per the design:
//   Blue   → Math
//   Green  → Reading
//   Yellow → English
//   Red    → PE
//   Main   → Home
//
// Door faces +Z in local space for each house GLB. To compute the trigger /
// portal position we rotate the local door offset by the house yaw and add to
// the house position.

import type { HouseSubject } from '@/hooks/useGameStore'

export interface Portal {
  subject: HouseSubject
  label: string
  color: string
  /** House origin in world space. */
  housePosition: [number, number, number]
  /** House yaw in radians (rotation Y from the .zcomp). */
  houseYaw: number
}

// Color hex per subject — used for the glowing portal ring.
export const PORTAL_COLORS: Record<HouseSubject, string> = {
  math: '#4DA8DA',
  reading: '#5BC675',
  english: '#FFD86E',
  pe: '#E76F6F',
  home: '#B89AE0',
}

export const PORTALS: readonly Portal[] = [
  {
    subject: 'math',
    label: 'Математика',
    color: PORTAL_COLORS.math,
    housePosition: [-7.932975, 2.066764, 7.653814],
    houseYaw: 0,
  },
  {
    subject: 'reading',
    label: 'Чтение',
    color: PORTAL_COLORS.reading,
    housePosition: [7.135908, 2.71294, 19.65324],
    houseYaw: 0,
  },
  {
    subject: 'english',
    label: 'Английский',
    color: PORTAL_COLORS.english,
    housePosition: [6.74195, 2.992029, -18.054173],
    houseYaw: -1.5646,
  },
  {
    subject: 'pe',
    label: 'Физкультура',
    color: PORTAL_COLORS.pe,
    housePosition: [-18.030308, 2.45301, -5.521905],
    houseYaw: 1.5793,
  },
  {
    subject: 'home',
    label: 'Мой дом',
    color: PORTAL_COLORS.home,
    housePosition: [19.255938, 3.211842, 7.439676],
    houseYaw: 1.5737,
  },
] as const

// Distance from house center to its door, in world units. Houses are scaled 4×;
// the raw GLB door sits ~1.6 units in front of origin → ~6.4 after scale, plus a
// small landing strip so the player stops on the porch (not inside the wall).
export const DOOR_OFFSET = 6.5

// Trigger sphere radius (player must be within this distance of the door).
export const TRIGGER_RADIUS = 3.0
