// Barrel re-export for task content.
// Import getLevel and types from here so tasks.ts has a single import point.

export type {
  TaskItem,
  TaskItemClient,
  Subject,
  TaskItemType,
  AnswerValue,
} from './types'
export { isAnswerCorrect } from './types'
export { PE_EXERCISES, getPEExercise } from './pe'
export type { PEExercise } from './pe'

import { generateMathLevel } from './math/generator'
import { getLevel as getReadingLevel } from './reading'
import { getLevel as getEnglishLevel } from './english'
import type { TaskItem } from './types'
import type { Subject } from './types'

/**
 * Route a (subject, grade, level) triple to the correct content module.
 * `grade` is the school grade 1-7. `level` is 1-5 within a grade.
 * PE has no levels — throws 'LEVEL_NOT_FOUND' if called with 'PE'.
 */
export function loadLevel(
  subject: Subject,
  grade: number,
  level: number,
): TaskItem[] {
  const safeGrade = Math.max(1, Math.min(7, grade))
  const safeLevel = Math.max(1, Math.min(10, level))
  switch (subject) {
    case 'MATH':
      return generateMathLevel(safeGrade, safeLevel)
    case 'READING':
      return getReadingLevel(safeGrade, safeLevel)
    case 'ENGLISH':
      return getEnglishLevel(safeGrade, safeLevel)
    case 'PE':
      throw new Error('LEVEL_NOT_FOUND') // PE uses sessions, not levels
  }
}
