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
// `offsetDirection` is a world-space yaw (radians) that picks which side of the
// house the portal lands on. Convention used by Portals.tsx:
//   0     → +Z (south on the map)
//   π / 2 → +X (east)
//   π     → -Z (north)
//  -π / 2 → -X (west)

import type { HouseSubject } from '@/hooks/useGameStore'

export interface Portal {
  subject: HouseSubject
  label: string
  color: string
  /** House origin in world space. */
  housePosition: [number, number, number]
  /** World-space yaw (radians) — direction from house to portal. */
  offsetDirection: number
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
    subject: 'math', // blue — portal on the WEST side
    label: 'Математика',
    color: PORTAL_COLORS.math,
    housePosition: [-7.932975, 2.066764, 7.653814],
    offsetDirection: -Math.PI ,
  },
  {
    subject: 'reading', // green — portal on the EAST side
    label: 'Чтение',
    color: PORTAL_COLORS.reading,
    housePosition: [7.135908, 2.71294, 19.65324],
    offsetDirection: 3 * Math.PI / 2,
  },
  {
    subject: 'english', // yellow — door already faces this way; keep current
    label: 'Английский',
    color: PORTAL_COLORS.english,
    housePosition: [6.74195, 2.992029, -18.054173],
    offsetDirection: -1.5646,
  },
  {
    subject: 'pe', // red — portal on the EAST side
    label: 'Физкультура',
    color: PORTAL_COLORS.pe,
    housePosition: [-18.030308, 2.45301, -5.521905],
    offsetDirection: 0,
  },
  {
    subject: 'home', // main / white — portal on the WEST side
    label: 'Мой дом',
    color: PORTAL_COLORS.home,
    housePosition: [19.255938, 3.211842, 7.439676],
    offsetDirection: -Math.PI ,
  },
] as const

// Distance from house center to portal, in world units.
export const DOOR_OFFSET = 6.5

// Trigger sphere radius (player must be within this distance of the portal).
// Reduced 1.5× alongside the visual ring shrink.
export const TRIGGER_RADIUS = 2.0
