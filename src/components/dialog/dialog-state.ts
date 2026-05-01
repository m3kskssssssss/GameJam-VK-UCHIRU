'use client'

import { create } from 'zustand'

interface DialogState {
  currentNodeId: string
  chosenTaskKey: string | null
  isBusy: boolean
  setNode: (id: string) => void
  setTaskKey: (key: string | null) => void
  setBusy: (busy: boolean) => void
  reset: () => void
}

const INITIAL_STATE = {
  currentNodeId: 'entry',
  chosenTaskKey: null,
  isBusy: false,
}

export const useDialogState = create<DialogState>()((set) => ({
  ...INITIAL_STATE,
  setNode: (id) => set({ currentNodeId: id }),
  setTaskKey: (key) => set({ chosenTaskKey: key }),
  setBusy: (busy) => set({ isBusy: busy }),
  reset: () => set(INITIAL_STATE),
}))
