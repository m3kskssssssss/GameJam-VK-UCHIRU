// Barrel re-export for task content.
// Import getLevel and types from here so tasks.ts has a single import point.

export type { TaskItem, TaskItemClient, Subject, TaskItemType } from './types'
export { PE_EXERCISES, getPEExercise } from './pe'
export type { PEExercise } from './pe'

import { getLevel as getMathLevel } from './math'
import { getLevel as getReadingLevel } from './reading'
import { getLevel as getEnglishLevel } from './english'
import type { TaskItem } from './types'
import type { Subject } from './types'

/**
 * Route a (subject, level) pair to the correct content module.
 * PE has no levels — throws 'LEVEL_NOT_FOUND' if called with 'PE'.
 */
export function loadLevel(subject: Subject, level: number): TaskItem[] {
  switch (subject) {
    case 'MATH':
      return getMathLevel(level)
    case 'READING':
      return getReadingLevel(level)
    case 'ENGLISH':
      return getEnglishLevel(level)
    case 'PE':
      throw new Error('LEVEL_NOT_FOUND') // PE uses sessions, not levels
  }
}
