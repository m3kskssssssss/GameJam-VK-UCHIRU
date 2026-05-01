'use client'

import { useEffect, useRef, useState } from 'react'
import { portraitSrc } from './portrait-paths'
import type { Speaker, Emotion } from './portrait-paths'

interface Props {
  speaker: Speaker
  emotion: Emotion
  side: 'left' | 'right'
}

interface Layer {
  src: string
  opacity: number
}

export function Portrait({ speaker, emotion, side: _side }: Props) {
  const [current, setCurrent] = useState<Layer>({
    src: portraitSrc(speaker, emotion),
    opacity: 1,
  })
  const [prev, setPrev] = useState<Layer | null>(null)
  const prevSrcRef = useRef<string>(portraitSrc(speaker, emotion))
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const nextSrc = portraitSrc(speaker, emotion)
    if (nextSrc === prevSrcRef.current) return

    // Fade out previous, fade in next
    const fadingOut = prevSrcRef.current
    prevSrcRef.current = nextSrc

    setPrev({ src: fadingOut, opacity: 1 })
    setCurrent({ src: nextSrc, opacity: 0 })

    // Trigger fade: next tick so browser registers opacity 0 before transition
    requestAnimationFrame(() => {
      setCurrent({ src: nextSrc, opacity: 1 })
      setPrev((p) => (p ? { ...p, opacity: 0 } : null))
    })

    if (cleanupRef.current !== null) clearTimeout(cleanupRef.current)
    cleanupRef.current = setTimeout(() => {
      setPrev(null)
      cleanupRef.current = null
    }, 240)
  }, [speaker, emotion])

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  const imgStyle = (opacity: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    opacity,
    transition: 'opacity 220ms ease',
    pointerEvents: 'none',
    userSelect: 'none',
  })

  return (
    <div style={containerStyle}>
      {prev !== null && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prev.src}
          alt=""
          draggable={false}
          style={imgStyle(prev.opacity)}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.src}
        alt=""
        draggable={false}
        style={imgStyle(current.opacity)}
      />
    </div>
  )
}
