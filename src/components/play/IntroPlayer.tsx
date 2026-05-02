'use client'
// Fullscreen welcome-video player. Plays the clip once, then routes to /play.
// Bottom-right "Пропустить" button skips only on a 3-second hold — quick taps
// won't accidentally cut the intro on a child's first visit.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { markIntroWatched } from '@/server/actions/intro'

const HOLD_DURATION_MS = 3_000

interface IntroPlayerProps {
  src: string
}

export function IntroPlayer({ src }: IntroPlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const finishedRef = useRef(false)

  // Hold-to-skip state
  const [holdProgress, setHoldProgress] = useState(0) // 0..1
  const holdStartRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const finish = useCallback(async () => {
    if (finishedRef.current) return
    finishedRef.current = true
    try {
      await markIntroWatched()
    } catch {
      // Non-fatal — worst case the child sees the intro twice.
    }
    router.replace('/play')
    router.refresh()
  }, [router])

  // Auto-advance when video ends
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onEnded = () => {
      void finish()
    }
    v.addEventListener('ended', onEnded)
    return () => v.removeEventListener('ended', onEnded)
  }, [finish])

  // iOS sometimes needs a user gesture to start playing. Try once; if
  // autoplay is blocked we'll fall back to a tap-to-play overlay.
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const tryPlay = async () => {
      try {
        await v.play()
        setNeedsTapToPlay(false)
      } catch {
        setNeedsTapToPlay(true)
      }
    }
    void tryPlay()
  }, [])

  // ---- Hold-to-skip mechanics --------------------------------------------

  const stopHoldLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tickHold = useCallback(() => {
    const start = holdStartRef.current
    if (start === null) return
    const elapsed = performance.now() - start
    const ratio = Math.min(1, elapsed / HOLD_DURATION_MS)
    setHoldProgress(ratio)
    if (ratio >= 1) {
      stopHoldLoop()
      void finish()
      return
    }
    rafRef.current = requestAnimationFrame(tickHold)
  }, [finish, stopHoldLoop])

  const startHold = useCallback(
    (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
      // Capture the pointer so dragging slightly off the button still counts
      // as the same hold gesture.
      if ('pointerId' in e) {
        try {
          ;(e.target as Element).setPointerCapture(e.pointerId)
        } catch {
          // ignore — non-pointer-event environments
        }
      }
      holdStartRef.current = performance.now()
      stopHoldLoop()
      rafRef.current = requestAnimationFrame(tickHold)
    },
    [stopHoldLoop, tickHold],
  )

  const cancelHold = useCallback(() => {
    holdStartRef.current = null
    setHoldProgress(0)
    stopHoldLoop()
  }, [stopHoldLoop])

  useEffect(() => () => stopHoldLoop(), [stopHoldLoop])

  // ---- Render -------------------------------------------------------------

  // Conic-gradient fill represents the held portion (0..1).
  const filledDeg = Math.round(holdProgress * 360)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        autoPlay
        muted={false}
        controls={false}
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#000',
        }}
      />

      {/* Tap-to-play fallback (iOS autoplay sometimes refuses sound) */}
      {needsTapToPlay && (
        <button
          type="button"
          onClick={async () => {
            const v = videoRef.current
            if (!v) return
            try {
              await v.play()
              setNeedsTapToPlay(false)
            } catch {
              // user can keep tapping — we don't auto-skip
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.6vh, 1.4rem)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ▶ Нажми, чтобы начать
        </button>
      )}

      {/* Skip (hold) button — bottom-right with safe-area padding. */}
      <button
        type="button"
        aria-label="Удержи 3 секунды, чтобы пропустить"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'absolute',
          right: 'calc(env(safe-area-inset-right) + 16px)',
          bottom: 'calc(env(safe-area-inset-bottom) + 20px)',
          // The visible disc — slightly larger than a regular button so the
          // child's finger has a clear hit area.
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          background: 'transparent',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10,
        }}
      >
        {/* Conic progress ring + inner pill */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(#FFB347 ${filledDeg}deg, rgba(255,255,255,0.25) ${filledDeg}deg)`,
            transition: holdProgress === 0 ? 'background 200ms ease' : 'none',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            background: 'rgba(15,23,42,0.78)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 800,
            fontSize: '0.78rem',
            textAlign: 'center',
            lineHeight: 1.1,
            padding: '0 6px',
          }}
        >
          {holdProgress > 0 ? 'Держи' : 'Пропустить'}
        </span>
      </button>

      {/* Tiny helper text under the button */}
      <div
        style={{
          position: 'absolute',
          right: 'calc(env(safe-area-inset-right) + 16px)',
          bottom: 'calc(env(safe-area-inset-bottom) + 0px)',
          width: 72,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.75)',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '0.65rem',
          fontWeight: 600,
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        Удержи 3 сек.
      </div>
    </div>
  )
}
