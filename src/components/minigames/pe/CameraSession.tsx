'use client'

// CameraSession — silently captures two JPEG snapshots (10 s and 60 s)
// without showing any countdown to the child.
//
// DEV SHORTCUT: append ?peshort=1 to the URL to use 3 s / 8 s instead of
// 10 s / 60 s. Only active when window.location.search includes 'peshort=1'.

import { useEffect, useRef, useState } from 'react'
import type { PEExercise } from '@/server/content/pe'

interface CameraSessionProps {
  sessionId: string
  exercise: PEExercise
  onComplete: () => void
}

const SNAP_10S = 10_000
const SNAP_60S = 60_000
const DEV_SNAP_10S = 3_000
const DEV_SNAP_60S = 8_000
const CANVAS_W = 480
const CANVAS_H = 360

function isDevShort(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.search.includes('peshort=1')
}

async function uploadBlob(blob: Blob, sessionId: string, slot: '10s' | '60s'): Promise<void> {
  try {
    const fd = new FormData()
    fd.append('sessionId', sessionId)
    fd.append('slot', slot)
    fd.append('file', new File([blob], `pe-${slot}.jpg`, { type: 'image/jpeg' }))
    const res = await fetch('/api/pe/upload', { method: 'POST', body: fd })
    if (!res.ok) console.error('[CameraSession] upload failed', slot, res.status)
  } catch (err) {
    console.error('[CameraSession] upload error', slot, err)
  }
}

// Full-page wrapper used by all three inner states
function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[--color-background] flex items-center justify-center p-4">
      {children}
    </div>
  )
}

export function CameraSession({ sessionId, exercise, onComplete }: CameraSessionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timer10Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timer60Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // null = pending, true = granted, false = denied/unavailable
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null)
  const [noCameraMsg, setNoCameraMsg] = useState('')

  function captureAndUpload(slot: '10s' | '60s'): Promise<void> {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return Promise.resolve()
    const ctx = canvas.getContext('2d')
    if (!ctx) return Promise.resolve()
    ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H)
    return new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(); return }
          // Abort upload if the component has already unmounted
          if (!mountedRef.current) { resolve(); return }
          void uploadBlob(blob, sessionId, slot).finally(resolve)
        },
        'image/jpeg',
        0.85,
      )
    })
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    const devShort = isDevShort()
    const delay10 = devShort ? DEV_SNAP_10S : SNAP_10S
    const delay60 = devShort ? DEV_SNAP_60S : SNAP_60S
    let mounted = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraGranted(true)

        // 10 s snap — independent, fire and forget
        timer10Ref.current = setTimeout(() => { void captureAndUpload('10s') }, delay10)

        // 60 s snap — after upload, stop stream and complete
        timer60Ref.current = setTimeout(() => {
          void captureAndUpload('60s').then(() => {
            if (!mounted) return
            stopStream()
            onComplete()
          })
        }, delay60)
      } catch (err) {
        if (!mounted) return
        console.warn('[CameraSession] camera unavailable', err)
        setCameraGranted(false)
        setNoCameraMsg('Камера недоступна — упражнение засчитано, но без фото.')
        setTimeout(() => { if (mounted) onComplete() }, 2_000)
      }
    }

    void startCamera()
    return () => {
      mounted = false
      mountedRef.current = false
      if (timer10Ref.current !== null) clearTimeout(timer10Ref.current)
      if (timer60Ref.current !== null) clearTimeout(timer60Ref.current)
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Runs once on mount

  if (cameraGranted === null) {
    return (
      <FullPage>
        <div
          className="w-full max-w-sm rounded-[1rem] bg-[--color-muted] p-8 flex flex-col items-center gap-4"
          style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.24)' }}
        >
          <div className="w-10 h-10 rounded-full border-4 border-[--color-border] border-t-[--color-primary] animate-spin" />
          <p className="text-base font-semibold text-[--color-foreground] text-center">
            Запрашиваем доступ к камере...
          </p>
        </div>
      </FullPage>
    )
  }

  if (cameraGranted === false) {
    return (
      <FullPage>
        <div
          className="w-full max-w-sm rounded-[1rem] bg-[--color-muted] p-8 flex flex-col items-center gap-4"
          style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.24)' }}
        >
          <p className="text-[28px] font-extrabold text-[--color-foreground] text-center">
            Почти готово!
          </p>
          <p className="text-base text-[--color-foreground] opacity-70 text-center leading-snug">
            {noCameraMsg}
          </p>
        </div>
      </FullPage>
    )
  }

  // Camera granted — exercise in progress. NO countdown shown.
  return (
    <FullPage>
      {/* Hidden video for capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
      {/* Hidden canvas for snapshot */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
      {/* Visible exercise card */}
      <div
        className="w-full max-w-sm rounded-[1rem] bg-[--color-muted] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 6px 20px rgba(31,41,55,0.24)' }}
      >
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          {/* Solid placeholder — visible when image fails to load */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-sky-100"
            aria-hidden="true"
          >
            <span className="text-[3rem]">🏃</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exercise.illustration}
            alt={exercise.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { ;(e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <div className="p-6 flex flex-col items-center gap-3">
          <h2
            className="text-[22px] font-extrabold text-[--color-foreground] text-center"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {exercise.name}
          </h2>
          <p className="text-[15px] text-[--color-foreground] opacity-70 text-center leading-snug">
            {exercise.instruction}
          </p>
          <p className="text-[13px] text-[--color-foreground] opacity-40 text-center animate-pulse mt-1">
            Выполняй упражнение — скоро закончим!
          </p>
        </div>
      </div>
    </FullPage>
  )
}
