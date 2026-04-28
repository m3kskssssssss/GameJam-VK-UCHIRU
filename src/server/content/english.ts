// English content catalog.
// Level 1: 10 word-translation multiple_choice items (RU → EN basic vocab).
// Four options each; correct answer is the English word.
// Levels 2–10 are stubs re-using level-1 items with shifted IDs until Phase 5.

import type { TaskItem } from './types'

const LEVEL_1_ITEMS: TaskItem[] = [
  {
    id: 'english-1-01',
    type: 'multiple_choice',
    prompt: 'Как по-английски «кошка»?',
    options: ['dog', 'cat', 'cow', 'hen'],
    correct: 'cat',
  },
  {
    id: 'english-1-02',
    type: 'multiple_choice',
    prompt: 'Как по-английски «собака»?',
    options: ['cat', 'fox', 'dog', 'pig'],
    correct: 'dog',
  },
  {
    id: 'english-1-03',
    type: 'multiple_choice',
    prompt: 'Как по-английски «солнце»?',
    options: ['moon', 'star', 'sky', 'sun'],
    correct: 'sun',
  },
  {
    id: 'english-1-04',
    type: 'multiple_choice',
    prompt: 'Как по-английски «яблоко»?',
    options: ['pear', 'apple', 'plum', 'grape'],
    correct: 'apple',
  },
  {
    id: 'english-1-05',
    type: 'multiple_choice',
    prompt: 'Как по-английски «дом»?',
    options: ['room', 'door', 'house', 'wall'],
    correct: 'house',
  },
  {
    id: 'english-1-06',
    type: 'multiple_choice',
    prompt: 'Как по-английски «книга»?',
    options: ['pen', 'book', 'desk', 'bag'],
    correct: 'book',
  },
  {
    id: 'english-1-07',
    type: 'multiple_choice',
    prompt: 'Как по-английски «дерево»?',
    options: ['leaf', 'bush', 'tree', 'flower'],
    correct: 'tree',
  },
  {
    id: 'english-1-08',
    type: 'multiple_choice',
    prompt: 'Как по-английски «вода»?',
    options: ['milk', 'juice', 'tea', 'water'],
    correct: 'water',
  },
  {
    id: 'english-1-09',
    type: 'multiple_choice',
    prompt: 'Как по-английски «хлеб»?',
    options: ['cake', 'bread', 'rice', 'soup'],
    correct: 'bread',
  },
  {
    id: 'english-1-10',
    type: 'multiple_choice',
    prompt: 'Как по-английски «рыба»?',
    options: ['bird', 'frog', 'fish', 'bear'],
    correct: 'fish',
  },
]

/**
 * Returns 10 TaskItems for the given English level.
 * Level 1: RU→EN basic vocab translation (multiple_choice).
 * Levels 2–10: stubs (level-1 items with shifted IDs). Phase 5 will replace.
 */
export function getLevel(level: number): TaskItem[] {
  if (level < 1 || level > 10) {
    throw new Error('LEVEL_NOT_FOUND')
  }
  if (level === 1) return LEVEL_1_ITEMS

  return LEVEL_1_ITEMS.map((item) => ({
    ...item,
    id: `english-${level}-${item.id.split('-').pop() ?? '00'}`,
  }))
}
