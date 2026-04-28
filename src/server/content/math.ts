// Math content catalog.
// Convention: getLevel(n) returns exactly 10 TaskItems for level n.
// Levels 2–10 are stubs that re-use level-1 items with shifted IDs until
// the mini-game-developer fills in real content in Phase 5.
// All prompts ask "X + Y = ?" with multiple_choice (4 options).

import type { TaskItem } from './types'

const LEVEL_1_ITEMS: TaskItem[] = [
  {
    id: 'math-1-01',
    type: 'multiple_choice',
    prompt: '5 + 3 = ?',
    options: ['6', '7', '8', '9'],
    correct: '8',
  },
  {
    id: 'math-1-02',
    type: 'multiple_choice',
    prompt: '7 + 6 = ?',
    options: ['11', '12', '13', '14'],
    correct: '13',
  },
  {
    id: 'math-1-03',
    type: 'multiple_choice',
    prompt: '4 + 9 = ?',
    options: ['12', '13', '14', '15'],
    correct: '13',
    hint: 'Посчитай по пальцам',
  },
  {
    id: 'math-1-04',
    type: 'multiple_choice',
    prompt: '8 + 7 = ?',
    options: ['13', '14', '15', '16'],
    correct: '15',
  },
  {
    id: 'math-1-05',
    type: 'multiple_choice',
    prompt: '6 + 6 = ?',
    options: ['10', '11', '12', '13'],
    correct: '12',
  },
  {
    id: 'math-1-06',
    type: 'multiple_choice',
    prompt: '3 + 14 = ?',
    options: ['15', '16', '17', '18'],
    correct: '17',
  },
  {
    id: 'math-1-07',
    type: 'multiple_choice',
    prompt: '9 + 9 = ?',
    options: ['16', '17', '18', '19'],
    correct: '18',
  },
  {
    id: 'math-1-08',
    type: 'multiple_choice',
    prompt: '2 + 16 = ?',
    options: ['16', '17', '18', '19'],
    correct: '18',
  },
  {
    id: 'math-1-09',
    type: 'multiple_choice',
    prompt: '11 + 7 = ?',
    options: ['17', '18', '19', '20'],
    correct: '18',
  },
  {
    id: 'math-1-10',
    type: 'multiple_choice',
    prompt: '10 + 10 = ?',
    options: ['18', '19', '20', '21'],
    correct: '20',
  },
]

/**
 * Returns 10 TaskItems for the given math level.
 * Level 1: addition within 20.
 * Levels 2–10: stubs (level-1 items with shifted IDs). Phase 5 will replace.
 */
export function getLevel(level: number): TaskItem[] {
  if (level < 1 || level > 10) {
    throw new Error('LEVEL_NOT_FOUND')
  }
  if (level === 1) return LEVEL_1_ITEMS

  // Stub: re-use level-1 items with prefixed IDs so all IDs are unique.
  return LEVEL_1_ITEMS.map((item) => ({
    ...item,
    id: `math-${level}-${item.id.split('-').pop() ?? '00'}`,
  }))
}
