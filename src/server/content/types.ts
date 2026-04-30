// Common types for task content catalog.
// Content files are pure TS — no 'use server'.
//
// As of the grade-1..7 overhaul, TaskItem is a discriminated union supporting
// multiple input shapes. The client renders one of several *Item* components
// based on `type`. Server-side validation in src/server/actions/tasks.ts uses
// the same union to verify correctness.

export type TaskItemType =
  | 'multiple_choice'
  | 'text_input'
  | 'true_false'
  | 'match_pairs'
  | 'fill_blank'

interface TaskBase {
  id: string
  hint?: string
}

export interface MultipleChoiceTask extends TaskBase {
  type: 'multiple_choice'
  prompt: string
  options: string[]
  correct: string
}

export interface TextInputTask extends TaskBase {
  type: 'text_input'
  prompt: string
  /** Canonical correct answer (case-insensitive, whitespace-trimmed). */
  correct: string
  /** Optional alternative spellings/synonyms (also normalized on compare). */
  acceptable?: string[]
  /** Hint for the keyboard mode of the input (numeric → digit pad). */
  inputMode?: 'text' | 'numeric'
}

export interface TrueFalseTask extends TaskBase {
  type: 'true_false'
  prompt: string
  correct: boolean
}

export interface MatchPair {
  left: string
  right: string
}

export interface MatchPairsTask extends TaskBase {
  type: 'match_pairs'
  prompt: string
  pairs: MatchPair[]
}

export interface FillBlankTask extends TaskBase {
  type: 'fill_blank'
  /** Sentence with the blank as the literal token "___" (three underscores). */
  prompt: string
  before: string
  after: string
  correct: string
  acceptable?: string[]
}

export type TaskItem =
  | MultipleChoiceTask
  | TextInputTask
  | TrueFalseTask
  | MatchPairsTask
  | FillBlankTask

/** Items as received by the client — identical to TaskItem since the server
 *  sends full items including `correct` for instant client-side validation. */
export type TaskItemClient = TaskItem

// ---------------------------------------------------------------------------
// Answer values returned by the client per task
// ---------------------------------------------------------------------------

/** Multiple choice / text input / fill blank → string. True/false → boolean.
 *  Match pairs → array of right-side picks in left-side order. */
export type AnswerValue = string | boolean | string[]

export interface SubmittedAnswer {
  index: number
  value: AnswerValue
}

// ---------------------------------------------------------------------------
// Subject enum mirroring Prisma (kept in sync manually — both must stay aligned).
// ---------------------------------------------------------------------------

export type Subject = 'MATH' | 'READING' | 'ENGLISH' | 'PE'

// ---------------------------------------------------------------------------
// Validation helpers (used both client-side for instant feedback and
// server-side as the source of truth in tasks.ts).
// ---------------------------------------------------------------------------

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isAnswerCorrect(task: TaskItem, value: AnswerValue): boolean {
  switch (task.type) {
    case 'multiple_choice':
      return typeof value === 'string' && value === task.correct

    case 'text_input': {
      if (typeof value !== 'string') return false
      const v = normalizeText(value)
      if (v === normalizeText(task.correct)) return true
      return (task.acceptable ?? []).some((a) => normalizeText(a) === v)
    }

    case 'true_false':
      return typeof value === 'boolean' && value === task.correct

    case 'match_pairs': {
      if (!Array.isArray(value)) return false
      if (value.length !== task.pairs.length) return false
      return task.pairs.every((p, i) => p.right === value[i])
    }

    case 'fill_blank': {
      if (typeof value !== 'string') return false
      const v = normalizeText(value)
      if (v === normalizeText(task.correct)) return true
      return (task.acceptable ?? []).some((a) => normalizeText(a) === v)
    }
  }
}
