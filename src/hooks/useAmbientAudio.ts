// Hook that plays a looping ambient audio track with autoplay-policy handling.
// On first user gesture (if autoplay is blocked) it retries play() and removes
// the one-time listeners.

import { useEffect, useRef } from 'react'

interface AmbientAudioOptions {
  volume?: number
  loop?: boolean
}

export function useAmbientAudio(
  src: string,
  opts?: AmbientAudioOptions,
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // SSR guard — Audio is only available in the browser.
    if (typeof window === 'undefined') return

    const audio = new Audio(src)
    audio.loop = opts?.loop ?? true
    audio.volume = opts?.volume ?? 0.18
    audioRef.current = audio

    const attemptPlay = () => {
      audio.play().catch(() => {
        // Autoplay blocked — wait for first user gesture then retry once.
        const resume = () => {
          audio.play().catch(() => {})
          document.removeEventListener('pointerdown', resume)
          document.removeEventListener('keydown', resume)
        }
        document.addEventListener('pointerdown', resume)
        document.addEventListener('keydown', resume)
      })
    }

    attemptPlay()

    return () => {
      audio.pause()
      audio.currentTime = 0
      audioRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])
}
