'use client'
// Locks /play/* to landscape on touch devices and shows an overlay if the
// user holds the phone in portrait. screen.orientation.lock() requires a
// fullscreen activation gesture in most browsers, so we only call it the
// first time the user taps.

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface ScreenOrientationLockable extends ScreenOrientation {
  lock?: (mode: 'landscape' | 'portrait' | 'natural') => Promise<void>
}

export function OrientationGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isPortrait, setIsPortrait] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  // Subject mini-games (/play/house/*) are paged scrollable UIs — keep the
  // immersive lock for the 3D world only.
  const isImmersiveRoute = !pathname?.startsWith('/play/house')

  useEffect(() => {
    setIsTouch('ontouchstart' in window)

    function update() {
      const portrait = window.matchMedia('(orientation: portrait)').matches
      const small = window.innerWidth < 900
      setIsPortrait(portrait && small)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  // Lock the page to the visual viewport while playing — no rubber-band, no
  // address-bar peeking, no copy menu. Reverts on unmount so the parent
  // dashboard scrolls normally.
  useEffect(() => {
    if (!isImmersiveRoute) return

    const html = document.documentElement
    const body = document.body

    // Mobile-Safari URL bar trick — give the page slightly more height than
    // the viewport, scroll a few px down so the browser collapses its chrome,
    // then lock down to the visual viewport. Safe for desktop (no-op).
    const prevBodyMinHeight = body.style.minHeight
    body.style.minHeight = 'calc(100dvh + 80px)'

    let lockTimeoutId: number | null = null
    const scrollAndLock = () => {
      try {
        window.scrollTo(0, 80)
      } catch {
        // ignore — fallback for environments without scroll
      }
      lockTimeoutId = window.setTimeout(() => {
        body.style.minHeight = prevBodyMinHeight
        html.classList.add('kq-immersive')
        lockTimeoutId = null
      }, 80)
    }

    // Run on next frame so the new body height is applied before scroll.
    const rafId = window.requestAnimationFrame(scrollAndLock)

    function preventGesture(e: Event) {
      e.preventDefault()
    }
    function preventTouchMove(e: TouchEvent) {
      // Block iOS pull-to-refresh & rubber-band only when the gesture is
      // a multi-touch pinch — single-finger drags must still reach the canvas
      // (camera swipe, joystick).
      if (e.touches.length > 1) e.preventDefault()
    }

    document.addEventListener('gesturestart', preventGesture)
    document.addEventListener('gesturechange', preventGesture)
    document.addEventListener('gestureend', preventGesture)
    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      window.cancelAnimationFrame(rafId)
      if (lockTimeoutId !== null) window.clearTimeout(lockTimeoutId)
      body.style.minHeight = prevBodyMinHeight
      html.classList.remove('kq-immersive')
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('gestureend', preventGesture)
      document.removeEventListener('touchmove', preventTouchMove)
    }
  }, [isImmersiveRoute])

  // Try to lock orientation on the next pointerdown — most browsers require a
  // user-gesture activation. Best-effort; silently fails if unsupported.
  useEffect(() => {
    if (!isTouch || !isImmersiveRoute) return
    let triedOnce = false
    async function tryLock() {
      if (triedOnce) return
      triedOnce = true
      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>
        }
        if (document.fullscreenElement == null) {
          if (docEl.requestFullscreen) await docEl.requestFullscreen()
          else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen()
        }
        const orient = screen.orientation as ScreenOrientationLockable | undefined
        if (orient?.lock) await orient.lock('landscape')
      } catch {
        // Unsupported / denied — fall through to the rotate overlay instead.
      }
    }
    window.addEventListener('pointerdown', tryLock, { once: true })
    return () => window.removeEventListener('pointerdown', tryLock)
  }, [isTouch, isImmersiveRoute])

  return (
    <div
      className={isImmersiveRoute ? 'kq-fullscreen' : 'min-h-dvh w-full'}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
      {isImmersiveRoute && isPortrait && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.96)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            zIndex: 1000,
            color: '#fff',
            textAlign: 'center',
            padding: '2rem',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              animation: 'rotate-phone 1.4s ease-in-out infinite',
              transformOrigin: 'center',
            }}
            aria-hidden="true"
          >
            📱
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Поверни телефон
          </div>
          <div style={{ fontSize: '0.95rem', opacity: 0.8, maxWidth: 320 }}>
            Игра работает горизонтально — переверни устройство, чтобы продолжить.
          </div>
          <style>{`
            @keyframes rotate-phone {
              0%   { transform: rotate(0deg); }
              45%  { transform: rotate(-90deg); }
              55%  { transform: rotate(-90deg); }
              100% { transform: rotate(0deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
