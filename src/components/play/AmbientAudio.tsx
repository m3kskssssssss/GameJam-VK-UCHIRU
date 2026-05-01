'use client'
// Mounts as a side-effect-only component. Plays a looping ambient audio track.
// Returns null — no DOM output. Mount this outside the R3F Canvas.

import { useAmbientAudio } from '@/hooks/useAmbientAudio'

interface AmbientAudioProps {
  src?: string
}

export function AmbientAudio({ src = '/village.mp3' }: AmbientAudioProps) {
  useAmbientAudio(src)
  return null
}
