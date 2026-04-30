'use client'

import type { TaskItemClient, AnswerValue } from '@/server/content/types'
import { MultipleChoiceItem } from './MultipleChoiceItem'
import { TextInputItem } from './TextInputItem'
import { TrueFalseItem } from './TrueFalseItem'
import { MatchPairsItem } from './MatchPairsItem'
import { FillBlankItem } from './FillBlankItem'

interface Props {
  task: TaskItemClient
  disabled: boolean
  onAnswer: (value: AnswerValue, isCorrect: boolean) => void
}

/**
 * Dispatches a task to the appropriate item component based on its type.
 * Each item component knows the correct answer (sent from the server) and
 * computes correctness locally before bubbling up via onAnswer.
 *
 * IMPORTANT: every dispatched item gets `key={task.id}` so React unmounts the
 * previous instance when the task changes. Without this, internal state like
 * `picked`, `pairings`, `submitted` would leak from one question to the next
 * and the lock flags would freeze the next item before the user could touch it.
 */
export function TaskItemRenderer({ task, disabled, onAnswer }: Props) {
  switch (task.type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceItem
          key={task.id}
          task={task}
          disabled={disabled}
          onAnswer={(v, c) => onAnswer(v, c)}
        />
      )
    case 'text_input':
      return (
        <TextInputItem
          key={task.id}
          task={task}
          disabled={disabled}
          onAnswer={(v, c) => onAnswer(v, c)}
        />
      )
    case 'true_false':
      return (
        <TrueFalseItem
          key={task.id}
          task={task}
          disabled={disabled}
          onAnswer={(v, c) => onAnswer(v, c)}
        />
      )
    case 'match_pairs':
      return (
        <MatchPairsItem
          key={task.id}
          task={task}
          disabled={disabled}
          onAnswer={(v, c) => onAnswer(v, c)}
        />
      )
    case 'fill_blank':
      return (
        <FillBlankItem
          key={task.id}
          task={task}
          disabled={disabled}
          onAnswer={(v, c) => onAnswer(v, c)}
        />
      )
    default: {
      const _exhaustive: never = task
      void _exhaustive
      return null
    }
  }
}

/**
 * Serialise an answer value to a string for transport to the server.
 * Server is permissive about format thanks to normalise().
 */
export function serializeAnswer(value: AnswerValue): string {
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.join(',')
  return value
}
