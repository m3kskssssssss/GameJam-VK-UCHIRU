// Common types for task content catalog.
// Content files are pure TS — no 'use server'.

export type TaskItemType =
  | 'multiple_choice'
  | 'numeric_input'
  | 'arrange'
  | 'listen_choose'

export type TaskItem = {
  id: string
  type: TaskItemType
  prompt: string
  options?: string[]
  correct: string
  hint?: string
}

// The client receives this — correct is stripped before sending.
export type TaskItemClient = Omit<TaskItem, 'correct'>

// Subject enum mirroring Prisma (kept in sync manually — both must stay aligned).
export type Subject = 'MATH' | 'READING' | 'ENGLISH' | 'PE'
