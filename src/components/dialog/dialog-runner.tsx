'use client'

// useDialogRunner — state machine for the grandparent dialog graph.
// Drives the active node, photo-submission flow, and in-memory success nodes.

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBundle, getTask } from '@/server/content/grandparents'
import type { DialogNode, DialogOption } from '@/server/content/grandparents'
import type { Grandparent } from '@/server/content/grandparents'
import { recordTalkEvent } from '@/server/actions/quests'
import type { TalkEventKind } from '@/server/actions/quests'
import { useGameStore } from '@/hooks/useGameStore'

// Map a (npc, nextNodeId) pair to a quest-trackable talk kind. Returns null
// for nodes that don't unlock an initial-quest step.
function inferTalkKind(npc: Grandparent, nextNodeId: string): TalkEventKind | null {
  if (nextNodeId === 'chitchat') {
    return npc === 'grandma' ? 'talk_grandma_chitchat' : 'talk_grandpa_chitchat'
  }
  if (nextNodeId === 'lore_1') {
    return npc === 'grandma' ? 'talk_grandma_lore' : 'talk_grandpa_lore'
  }
  return null
}

// The success node shown after a photo is submitted successfully.
// Generated in memory — not part of the bundle's node graph.
function makeSuccessNode(speakerLabel: string): DialogNode {
  return {
    id: '__task_done__',
    text: 'Какой ты молодец! Я так горжусь тобой!',
    speakerLabel,
    emotionLeft: 'happy',
    emotionRight: 'happy',
    options: [
      {
        id: 'thanks',
        label: 'Спасибо!',
        action: 'goto',
        next: 'menu',
      },
    ],
  }
}

interface RunnerResult {
  currentNode: DialogNode
  isPhotoFlow: boolean
  activeTaskKey: string | null
  handleOption: (option: DialogOption) => void
  onPhotoSuccess: (reward: { coinsEarned: number; energyEarned: number }) => void
  onPhotoCancel: () => void
}

export function useDialogRunner(npc: Grandparent): RunnerResult {
  const router = useRouter()
  const bundle = getBundle(npc)
  const speakerLabel = npc === 'grandma' ? 'Бабушка' : 'Дедушка'

  const [currentNodeId, setCurrentNodeId] = useState<string>(bundle.entryNodeId)
  const [overrideNode, setOverrideNode] = useState<DialogNode | null>(null)
  const [isPhotoFlow, setIsPhotoFlow] = useState(false)
  const [activeTaskKey, setActiveTaskKey] = useState<string | null>(null)

  // Resolve the active node: override (e.g. success) takes priority over bundle graph
  const resolvedNode: DialogNode =
    overrideNode ?? bundle.nodes[currentNodeId] ?? bundle.nodes[bundle.entryNodeId]!

  const handleOption = useCallback(
    (option: DialogOption) => {
      const action = option.action ?? 'goto'

      if (action === 'close') {
        router.push('/play')
        return
      }

      if (action === 'open_task') {
        const key = option.taskKey
        if (!key) return
        const task = getTask(key)
        if (!task) return
        setActiveTaskKey(key)
        setIsPhotoFlow(true)
        setOverrideNode(null)
        return
      }

      // 'goto' — navigate within graph
      const next = option.next
      if (!next) return
      setOverrideNode(null)
      setCurrentNodeId(next)

      // Quest tracking: tag the initial-quest steps when the child enters
      // the chitchat / lore branches. Fire-and-forget; failures don't block
      // the dialog flow.
      const talkKind = inferTalkKind(npc, next)
      if (talkKind) {
        void recordTalkEvent({ kind: talkKind }).catch(() => {})
      }
    },
    [router, npc]
  )

  const onPhotoSuccess = useCallback(
    (reward: { coinsEarned: number; energyEarned: number }) => {
      setIsPhotoFlow(false)
      // Stash a pending-reward payload that the world overlay reads when
      // the dialog closes — gives the player the "Молодец! Задание
      // выполнено" celebration over the 3D scene.
      if (activeTaskKey) {
        const task = getTask(activeTaskKey)
        if (task) {
          useGameStore.getState().setPendingReward({
            title: task.title,
            coinsEarned: reward.coinsEarned,
            energyEarned: reward.energyEarned,
          })
        }
      }
      setActiveTaskKey(null)
      setOverrideNode(makeSuccessNode(speakerLabel))
    },
    [speakerLabel, activeTaskKey],
  )

  const onPhotoCancel = useCallback(() => {
    setIsPhotoFlow(false)
    setActiveTaskKey(null)
  }, [])

  return {
    currentNode: resolvedNode,
    isPhotoFlow,
    activeTaskKey,
    handleOption,
    onPhotoSuccess,
    onPhotoCancel,
  }
}
