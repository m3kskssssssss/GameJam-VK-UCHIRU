'use server'
// Quest progression — three quest tracks (initial / daily / main).
// Each step is a derived predicate over real game progress (TaskAttempt rows,
// GrandparentTaskCompletion rows) plus a JSON flag bag stored on Child.questFlags
// for events that aren't represented in any other table (NPC dialog talks,
// lobby-game plays counter).

import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireChild } from '@/server/auth/guards'

// ---------------------------------------------------------------------------
// Flag shape
// ---------------------------------------------------------------------------

export type TalkEventKind =
  | 'talk_grandma_chitchat'
  | 'talk_grandma_lore'
  | 'talk_grandpa_chitchat'
  | 'talk_grandpa_lore'

interface QuestFlags {
  talk_grandma_chitchat?: boolean
  talk_grandma_lore?: boolean
  talk_grandpa_chitchat?: boolean
  talk_grandpa_lore?: boolean
  /** Cumulative total of finished lobby-game rounds. */
  lobby_games_played?: number
}

function readFlags(raw: Prisma.JsonValue | null | undefined): QuestFlags {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as QuestFlags
}

// ---------------------------------------------------------------------------
// Quest state shape exposed to the UI
// ---------------------------------------------------------------------------

export type QuestKind = 'INITIAL' | 'DAILY' | 'MAIN'

export interface QuestStepView {
  id: string
  label: string
  done: boolean
}

export interface QuestView {
  kind: QuestKind
  title: string
  subtitle: string
  steps: QuestStepView[]
  completed: boolean
  /** True when the quest cannot yet be progressed (e.g. main quest before initial). */
  locked: boolean
}

export interface QuestStateView {
  initial: QuestView
  daily: QuestView
  main: QuestView
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfLocalDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const TALK_KINDS: ReadonlyArray<TalkEventKind> = [
  'talk_grandma_chitchat',
  'talk_grandma_lore',
  'talk_grandpa_chitchat',
  'talk_grandpa_lore',
]

const TalkKindSchema = z.enum([
  'talk_grandma_chitchat',
  'talk_grandma_lore',
  'talk_grandpa_chitchat',
  'talk_grandpa_lore',
])

// ---------------------------------------------------------------------------
// getQuestState — derive the full quest dashboard for the current child.
// ---------------------------------------------------------------------------

export async function getQuestState(): Promise<QuestStateView> {
  const child = await requireChild()

  const [childRow, grandmaCount, grandpaCount, todayPasses] = await Promise.all([
    prisma.child.findUniqueOrThrow({
      where: { id: child.id },
      select: { questFlags: true },
    }),
    prisma.grandparentTaskCompletion.count({
      where: { childId: child.id, grandparent: 'GRANDMA' },
    }),
    prisma.grandparentTaskCompletion.count({
      where: { childId: child.id, grandparent: 'GRANDPA' },
    }),
    prisma.taskAttempt.findMany({
      where: {
        childId: child.id,
        passed: true,
        createdAt: { gte: startOfLocalDay() },
      },
      select: { subject: true },
    }),
  ])

  const flags = readFlags(childRow.questFlags)
  const todaySubjects = new Set(todayPasses.map((a) => a.subject))
  const lobbyPlays = flags.lobby_games_played ?? 0

  // ----- INITIAL -----
  const initialSteps: QuestStepView[] = [
    {
      id: 'talk_grandma_chitchat',
      label: 'Спроси у бабушки, как у неё дела',
      done: Boolean(flags.talk_grandma_chitchat),
    },
    {
      id: 'talk_grandpa_chitchat',
      label: 'Спроси у дедушки, как у него дела',
      done: Boolean(flags.talk_grandpa_chitchat),
    },
    {
      id: 'talk_grandma_lore',
      label: 'Расспроси бабушку о её прошлом',
      done: Boolean(flags.talk_grandma_lore),
    },
    {
      id: 'talk_grandpa_lore',
      label: 'Расспроси дедушку о его прошлом',
      done: Boolean(flags.talk_grandpa_lore),
    },
    {
      id: 'task_grandma_first',
      label: 'Выполни одно задание у бабушки',
      done: grandmaCount >= 1,
    },
    {
      id: 'task_grandpa_first',
      label: 'Выполни одно задание у дедушки',
      done: grandpaCount >= 1,
    },
  ]
  const initialCompleted = initialSteps.every((s) => s.done)

  // ----- DAILY (resets at local midnight) -----
  const dailySteps: QuestStepView[] = [
    {
      id: 'daily_math',
      label: 'Пройди уровень по математике',
      done: todaySubjects.has('MATH'),
    },
    {
      id: 'daily_reading',
      label: 'Пройди уровень по чтению',
      done: todaySubjects.has('READING'),
    },
    {
      id: 'daily_english',
      label: 'Пройди уровень по английскому',
      done: todaySubjects.has('ENGLISH'),
    },
  ]
  const dailyCompleted = dailySteps.every((s) => s.done)

  // ----- MAIN (locked until INITIAL is fully complete) -----
  const lobbyCap = Math.min(lobbyPlays, 2)
  const grandmaCap = Math.min(grandmaCount, 3)
  const grandpaCap = Math.min(grandpaCount, 3)
  const mainSteps: QuestStepView[] = [
    {
      id: 'main_lobby_games',
      label: `Поиграй на сервере (${lobbyCap}/2)`,
      done: lobbyPlays >= 2,
    },
    {
      id: 'main_grandma_three',
      label: `Выполни 3 задания у бабушки (${grandmaCap}/3)`,
      done: grandmaCount >= 3,
    },
    {
      id: 'main_grandpa_three',
      label: `Выполни 3 задания у дедушки (${grandpaCap}/3)`,
      done: grandpaCount >= 3,
    },
  ]
  const mainCompleted = mainSteps.every((s) => s.done)

  return {
    initial: {
      kind: 'INITIAL',
      title: 'Начальный квест',
      subtitle: 'Знакомство с бабушкой и дедушкой',
      steps: initialSteps,
      completed: initialCompleted,
      locked: false,
    },
    daily: {
      kind: 'DAILY',
      title: 'Ежедневный квест',
      subtitle: 'Сегодняшние задания на каждый день',
      steps: dailySteps,
      completed: dailyCompleted,
      locked: false,
    },
    main: {
      kind: 'MAIN',
      title: 'Основной квест',
      subtitle: initialCompleted
        ? 'Большие приключения деревни'
        : 'Откроется после начального квеста',
      steps: mainSteps,
      completed: mainCompleted,
      locked: !initialCompleted,
    },
  }
}

// ---------------------------------------------------------------------------
// recordTalkEvent — flip a talk-flag for the current child.
// Idempotent: re-firing the same kind is a no-op.
// ---------------------------------------------------------------------------

export async function recordTalkEvent(input: { kind: TalkEventKind }): Promise<void> {
  const parsed = TalkKindSchema.safeParse(input.kind)
  if (!parsed.success) throw new Error('INVALID_INPUT')
  const child = await requireChild()

  const row = await prisma.child.findUniqueOrThrow({
    where: { id: child.id },
    select: { questFlags: true },
  })
  const flags = readFlags(row.questFlags)
  if (flags[parsed.data]) return

  const next: QuestFlags = { ...flags, [parsed.data]: true }
  await prisma.child.update({
    where: { id: child.id },
    data: { questFlags: next as unknown as Prisma.InputJsonValue },
  })
}

// ---------------------------------------------------------------------------
// recordLobbyGamePlayed — increment cumulative lobby-game counter.
// Called from finishLobbyGame so the main quest's "play 2 games" step
// progresses as the child finishes rounds.
// ---------------------------------------------------------------------------

export async function recordLobbyGamePlayed(): Promise<void> {
  const child = await requireChild()
  const row = await prisma.child.findUniqueOrThrow({
    where: { id: child.id },
    select: { questFlags: true },
  })
  const flags = readFlags(row.questFlags)
  const next: QuestFlags = {
    ...flags,
    lobby_games_played: (flags.lobby_games_played ?? 0) + 1,
  }
  await prisma.child.update({
    where: { id: child.id },
    data: { questFlags: next as unknown as Prisma.InputJsonValue },
  })
}

// keep the constant referenced so dead-code elimination doesn't drop it (and
// makes typo-safe lookups available to consumers if needed in the future)
export const ALL_TALK_KINDS = TALK_KINDS
