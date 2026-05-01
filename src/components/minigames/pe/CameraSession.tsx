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
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[CameraSession] upload failed', slot, res.status, text)
    }
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

// Wait until the video element actually has decoded a frame (readyState
// HAVE_CURRENT_DATA or higher). Browsers may delay this past `loadedmetadata`,
// so we listen for both events and also poll readyState as a final guard.
function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 4000): Promise<void> {
  return new Promise<void>((resolve) => {
    if (video.readyState >= 2) {
      resolve()
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      video.removeEventListener('loadeddata', finish)
      video.removeEventListener('playing', finish)
      window.clearInterval(pollId)
      window.clearTimeout(timeoutId)
      resolve()
    }
    video.addEventListener('loadeddata', finish)
    video.addEventListener('playing', finish)
    const pollId = window.setInterval(() => {
      if (video.readyState >= 2) finish()
    }, 100)
    const timeoutId = window.setTimeout(finish, timeoutMs)
  })
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
    if (!video || !canvas) {
      console.warn('[CameraSession] capture skipped — refs missing', slot)
      return Promise.resolve()
    }
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn(
        '[CameraSession] capture skipped — video not ready',
        slot,
        'readyState=', video.readyState,
        'size=', video.videoWidth, '×', video.videoHeight,
      )
      return Promise.resolve()
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return Promise.resolve()
    // Cover-fit: keep the camera aspect, crop to fill the 480×360 canvas.
    const srcAR = video.videoWidth / video.videoHeight
    const dstAR = CANVAS_W / CANVAS_H
    let sx = 0
    let sy = 0
    let sw = video.videoWidth
    let sh = video.videoHeight
    if (srcAR > dstAR) {
      sw = video.videoHeight * dstAR
      sx = (video.videoWidth - sw) / 2
    } else if (srcAR < dstAR) {
      sh = video.videoWidth / dstAR
      sy = (video.videoHeight - sh) / 2
    }
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H)
    return new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn('[CameraSession] toBlob returned null', slot)
            resolve()
            return
          }
          // Don't bail on unmount — the upload is the WHOLE point of the
          // session. Browsers keep in-flight fetches running for a moment
          // after navigation, so even if the user clicks away the photo
          // usually still lands on the server.
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

  // 1) Acquire the camera. Stream is stashed in a ref; the actual <video>
  //    wiring happens below in a separate effect that runs AFTER the video
  //    element is mounted (cameraGranted flips to true → re-render → ref is
  //    attached → that effect fires).
  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setCameraGranted(true)
      } catch (err) {
        if (cancelled) return
        console.warn('[CameraSession] camera unavailable', err)
        setCameraGranted(false)
        setNoCameraMsg('Камера недоступна — упражнение засчитано, но без фото.')
        setTimeout(() => { if (!cancelled) onComplete() }, 2_000)
      }
    }

    void startCamera()
    return () => {
      cancelled = true
      mountedRef.current = false
      if (timer10Ref.current !== null) clearTimeout(timer10Ref.current)
      if (timer60Ref.current !== null) clearTimeout(timer60Ref.current)
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) Once cameraGranted flips to true, the video element is in the DOM.
  //    Attach the stream, wait for a real frame, then schedule the snaps.
  //    This split is what fixes the silent "no photo" bug — earlier the
  //    srcObject assignment ran before the video JSX was rendered, so
  //    drawImage was capturing a 0×0 video and toBlob returned an empty /
  //    null blob → no upload → null URL on the parent dashboard.
  useEffect(() => {
    if (cameraGranted !== true) return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    let cancelled = false

    async function go() {
      video!.srcObject = stream!
      // Some browsers (notably mobile Safari) need an explicit play() even
      // with autoPlay set; ignore the rejection that fires if the user
      // navigates away mid-call.
      try { await video!.play() } catch { /* ignore */ }
      await waitForVideoReady(video!)
      if (cancelled || !mountedRef.current) return

      const devShort = isDevShort()
      const delay10 = devShort ? DEV_SNAP_10S : SNAP_10S
      const delay60 = devShort ? DEV_SNAP_60S : SNAP_60S

      timer10Ref.current = setTimeout(() => {
        void captureAndUpload('10s')
      }, delay10)

      timer60Ref.current = setTimeout(() => {
        void captureAndUpload('60s').then(() => {
          if (cancelled || !mountedRef.current) return
          stopStream()
          onComplete()
        })
      }, delay60)
    }

    void go()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraGranted])

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
      {/* Hidden video for capture — positioned offscreen at sensible
          dimensions so the browser keeps decoding frames. width:1/height:1
          plus opacity:0 used to make some browsers drop the decode pipeline
          which silently broke the snapshot. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          left: -10_000,
          top: -10_000,
          width: CANVAS_W,
          height: CANVAS_H,
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      {/* Hidden canvas for snapshot */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          position: 'absolute',
          left: -10_000,
          top: -10_000,
          width: CANVAS_W,
          height: CANVAS_H,
          opacity: 0,
          pointerEvents: 'none',
        }}
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
