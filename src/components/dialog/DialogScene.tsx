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
}

export function DialogScene({ npc, childGender }: Props) {
  const { reset } = useDialogState()

  const { currentNode, isPhotoFlow, activeTaskKey, handleOption, onPhotoSuccess, onPhotoCancel } =
    useDialogRunner(npc)

  // Reset Zustand store on mount/unmount (kept for backward compat with any future consumers)
  useEffect(() => {
    reset()
    return () => {
      reset()
    }
  }, [reset])

  const childSpeaker: Speaker = childGender === 'BOY' ? 'boy' : 'girl'
  const npcSpeaker: Speaker = npc

  const boxOptions: BoxOption[] = currentNode.options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    variant: opt.action === 'close' ? 'leave' : 'default',
    onPick: () => handleOption(opt),
  }))

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'rgba(15,23,42,0.78)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  }

  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  }

  const portraitSlotStyle: React.CSSProperties = {
    position: 'relative',
    height: 'min(520px, 60vh)',
    width: 'min(380px, 38vw)',
    flexShrink: 0,
    pointerEvents: 'none',
  }

  const activeTask = activeTaskKey ? getTask(activeTaskKey) : undefined

  return (
    <div style={overlayStyle}>
      {/* Portrait layer */}
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

      {/* Dialog box */}
      <DialogBox
        text={currentNode.text}
        speakerLabel={currentNode.speakerLabel}
        options={boxOptions}
        isBusy={isPhotoFlow}
      />

      {/* Photo submission overlay — rendered on top when active */}
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
