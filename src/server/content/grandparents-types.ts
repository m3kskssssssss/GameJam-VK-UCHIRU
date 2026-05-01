// Types for grandparent NPC tasks and dialog graph.
// No runtime dependencies — pure type declarations.

import type { Emotion } from '@/components/dialog/portrait-paths'

export type Grandparent = 'grandma' | 'grandpa'
export type TaskCategory = 'draw' | 'sculpt' | 'origami' | 'real'

export interface GrandparentTask {
  key: string // unique across both NPCs, e.g. 'grandma_draw_cat'
  npc: Grandparent
  category: TaskCategory
  title: string // 'Нарисуй кота'
  npcDescription: string // what the NPC says when presenting the task
  difficulty: 1 | 2 | 3
  rewardCoins: number
  rewardEnergy: number
}

export type DialogActionKind = 'open_task' | 'close' | 'goto'

export interface DialogOption {
  id: string // local within node
  label: string // button text
  next?: string // next node id (for 'goto' or default navigation)
  action?: DialogActionKind // 'close' = router.push('/play'), 'open_task' = enter photo flow
  taskKey?: string // required if action='open_task'
}

export interface DialogNode {
  id: string
  text: string
  speakerLabel: string // 'Бабушка', 'Дедушка', 'Ты'
  emotionLeft: Emotion // child portrait emotion
  emotionRight: Emotion // npc portrait emotion
  options: DialogOption[]
}

export interface GrandparentBundle {
  tasks: GrandparentTask[]
  nodes: Record<string, DialogNode> // keyed by id
  entryNodeId: string // 'entry'
}
