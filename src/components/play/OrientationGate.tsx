'use client'
// Locks /play/* to landscape on touch devices and shows an overlay if the
// user holds the phone in portrait. screen.orientation.lock() requires a
// fullscreen activation gesture in most browsers, so we only call it the
// first time the user taps.

import { useEffect, useState } from 'react'

interface ScreenOrientationLockable extends ScreenOrientation {
  lock?: (mode: 'landscape' | 'portrait' | 'natural') => Promise<void>
}

export function OrientationGate({ children }: { children: React.ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

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

  // Try to lock orientation on the next pointerdown — most browsers require a
  // user-gesture activation. Best-effort; silently fails if unsupported.
  useEffect(() => {
    if (!isTouch) return
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
  }, [isTouch])

  return (
    <>
      {children}
      {isPortrait && (
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
    </>
  )
}
