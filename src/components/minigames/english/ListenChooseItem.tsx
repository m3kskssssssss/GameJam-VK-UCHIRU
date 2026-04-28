'use client'

import { useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'
import { MultipleChoiceItem } from '@/components/minigames/math/MultipleChoiceItem'

// ---------------------------------------------------------------------------
// TTS helper (safe to call on server — guard included)
// ---------------------------------------------------------------------------

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ListenChooseItemProps {
  audioText: string   // English text to speak aloud
  options: string[]   // 4 Russian translations to choose from
  onSelect: (answer: string) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListenChooseItem({
  audioText,
  options,
  onSelect,
  disabled = false,
}: ListenChooseItemProps) {
  const ttsSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  // Auto-play once on mount
  const hasPlayedRef = useRef(false)
  useEffect(() => {
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true
      speak(audioText)
    }
    // Stop speech when item unmounts
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [audioText])

  return (
    <div className="flex flex-col gap-6">
      {/* Speaker button — or text fallback */}
      <div className="flex flex-col items-center gap-3">
        {ttsSupported ? (
          <button
            type="button"
            aria-label="Прослушать слово"
            onClick={() => speak(audioText)}
            disabled={disabled}
            className="
              flex items-center justify-center
              w-16 h-16 rounded-full
              bg-[--color-primary] text-white
              hover:bg-[--color-primary]/80
              active:scale-95
              transition-all duration-100
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            "
          >
            <Volume2 size={30} strokeWidth={2} />
          </button>
        ) : (
          <p className="text-[22px] font-bold text-[--color-foreground] text-center">
            {audioText}
          </p>
        )}
        <p className="text-sm text-[--color-foreground] opacity-60">
          Нажми, чтобы услышать слово
        </p>
      </div>

      {/* Answer options */}
      <MultipleChoiceItem
        options={options}
        onSelect={onSelect}
        disabled={disabled}
      />
    </div>
  )
}
