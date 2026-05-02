'use client'

import { useEffect } from 'react'
import { Portrait } from './Portrait'
import { DialogBox } from './DialogBox'
import { PhotoSubmission } from './PhotoSubmission'
import { useDialogRunner } from './dialog-runner'
import { useDialogState } from './dialog-state'
import { getTask } from '@/server/content/grandparents'
import type { Speaker } from './portrait-paths'
import type { DialogOption as BoxOption } from './DialogBox'

interface Props {
  npc: 'grandma' | 'grandpa'
  childGender: 'BOY' | 'GIRL'
  completedTaskKeys: string[]
}

// Task-menu options follow the convention `menu_task_<taskKey>`. Anything
// matching that prefix is rendered as a task tile in the 2-col grid.
const TASK_OPTION_PREFIX = 'menu_task_'

export function DialogScene({ npc, childGender, completedTaskKeys }: Props) {
  const { reset } = useDialogState()
  const completedSet = new Set(completedTaskKeys)

  const { currentNode, isPhotoFlow, activeTaskKey, handleOption, onPhotoSuccess, onPhotoCancel } =
    useDialogRunner(npc)

  useEffect(() => {
    reset()
    return () => {
      reset()
    }
  }, [reset])

  const childSpeaker: Speaker = childGender === 'BOY' ? 'boy' : 'girl'
  const npcSpeaker: Speaker = npc

  const boxOptions: BoxOption[] = currentNode.options.map((opt) => {
    const isTaskOption = opt.id.startsWith(TASK_OPTION_PREFIX)
    const taskKey = isTaskOption ? opt.id.slice(TASK_OPTION_PREFIX.length) : null

    let variant: BoxOption['variant'] = 'default'
    if (opt.action === 'close') variant = 'leave'
    else if (isTaskOption) variant = 'task'

    return {
      id: opt.id,
      label: opt.label,
      variant,
      completed: taskKey !== null && completedSet.has(taskKey),
      onPick: () => handleOption(opt),
    }
  })

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'rgba(15,23,42,0.78)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    // Keep all children clear of the iOS Dynamic Island / notch in landscape.
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    boxSizing: 'border-box',
  }

  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  }

  // Fluid portrait slot — same proportions on every device. On a 932×430
  // landscape phone this is ~205×215; on a 1920×1080 desktop ~360×520.
  const portraitSlotStyle: React.CSSProperties = {
    position: 'relative',
    height: 'clamp(180px, 55vh, 520px)',
    width: 'clamp(110px, 22vw, 360px)',
    flexShrink: 0,
    pointerEvents: 'none',
  }

  const activeTask = activeTaskKey ? getTask(activeTaskKey) : undefined

  return (
    <div style={overlayStyle}>
      <div style={stageStyle}>
        <div style={portraitSlotStyle}>
          <Portrait
            speaker={childSpeaker}
            emotion={currentNode.emotionLeft}
            side="left"
          />
        </div>
        <div style={portraitSlotStyle}>
          <Portrait
            speaker={npcSpeaker}
            emotion={currentNode.emotionRight}
            side="right"
          />
        </div>
      </div>

      <DialogBox
        text={currentNode.text}
        speakerLabel={currentNode.speakerLabel}
        options={boxOptions}
        isBusy={isPhotoFlow}
      />

      {isPhotoFlow && activeTask && (
        <PhotoSubmission
          task={activeTask}
          onSuccess={onPhotoSuccess}
          onCancel={onPhotoCancel}
        />
      )}
    </div>
  )
}
