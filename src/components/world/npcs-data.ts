// NPC trigger zones for Grandma and Grandpa characters in the Mattercraft scene.
// Y-coordinate is 0.05 (disc sits on the ground), not the model's center height.

export type NpcKind = 'grandma' | 'grandpa'

export interface Npc {
  kind: NpcKind
  label: string
  position: [number, number, number]
  triggerRadius: number
}

export const NPC_TRIGGER_RADIUS = 2.5

export const NPCS: readonly Npc[] = [
  { kind: 'grandma', label: 'Бабушка', position: [3.52, 0.05, -11.96], triggerRadius: NPC_TRIGGER_RADIUS },
  { kind: 'grandpa', label: 'Дедушка', position: [8.78, 0.05, -3.77], triggerRadius: NPC_TRIGGER_RADIUS },
] as const
