// Barrel export for grandparent content.
// Consumers import from '@/server/content/grandparents'.

export type {
  Grandparent,
  TaskCategory,
  GrandparentTask,
  DialogActionKind,
  DialogOption,
  DialogNode,
  GrandparentBundle,
} from './grandparents-types'

export { GRANDMA_BUNDLE } from './grandma-bundle'
export { GRANDPA_BUNDLE } from './grandpa-bundle'

import type { Grandparent, GrandparentBundle, GrandparentTask } from './grandparents-types'
import { GRANDMA_BUNDLE } from './grandma-bundle'
import { GRANDPA_BUNDLE } from './grandpa-bundle'

export function getBundle(npc: Grandparent): GrandparentBundle {
  return npc === 'grandma' ? GRANDMA_BUNDLE : GRANDPA_BUNDLE
}

const ALL_TASKS: GrandparentTask[] = [
  ...GRANDMA_BUNDLE.tasks,
  ...GRANDPA_BUNDLE.tasks,
]

const TASK_MAP = new Map<string, GrandparentTask>(ALL_TASKS.map((t) => [t.key, t]))

export function getTask(taskKey: string): GrandparentTask | undefined {
  return TASK_MAP.get(taskKey)
}

export function getAllTasks(): GrandparentTask[] {
  return ALL_TASKS
}
