'use client'
// Shared input wiring used by every 3D scene:
//  - WASD/arrow movement (sets velocity in store)
//  - Mouse drag with primary button on the canvas → camera yaw/pitch
//  - Q/E keys → camera yaw

import { useEffect } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const YAW_KEY_RATE = 1.8 // rad/s
const YAW_DRAG_FACTOR = 0.0055
const PITCH_DRAG_FACTOR = 0.0035

export function useSceneInput(targetRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const setVelocity = useGameStore.getState().setVelocity
    const held = new Set<string>()

    function compute() {
      let vx = 0
      let vz = 0
      if (held.has('arrowleft') || held.has('a')) vx -= 1
      if (held.has('arrowright') || held.has('d')) vx += 1
      if (held.has('arrowup') || held.has('w')) vz -= 1
      if (held.has('arrowdown') || held.has('s')) vz += 1
      setVelocity(vx, vz)
    }

    function down(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault()
      }
      // Space → jump (only on keydown, not autorepeat)
      if (k === ' ' && !e.repeat) {
        useGameStore.getState().jump()
      }
      // Shift → start running
      if (k === 'shift' && !e.repeat) {
        useGameStore.getState().setRunning(true)
      }
      held.add(k)
      compute()
    }

    function up(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if (k === 'shift') {
        useGameStore.getState().setRunning(false)
      }
      held.delete(k)
      compute()
    }

    // Yaw via Q/E keys — integrate in rAF for smooth rate.
    let rafId: number | null = null
    let last = performance.now()
    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let yawDelta = 0
      if (held.has('q')) yawDelta -= YAW_KEY_RATE * dt
      if (held.has('e')) yawDelta += YAW_KEY_RATE * dt
      if (yawDelta !== 0) {
        useGameStore.getState().addCameraYaw(yawDelta)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      held.clear()
      setVelocity(0, 0)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  // Mouse drag on the target element rotates the camera.
  useEffect(() => {
    const el = targetRef?.current
    if (!el) return

    let dragging = false
    let pointerId = -1
    let lastX = 0
    let lastY = 0

    function onDown(e: PointerEvent) {
      // Only react to primary button (left click) on mouse — touch always works.
      if (e.pointerType === 'mouse' && e.button !== 0) return
      // Ignore drags that start on UI overlays (e.g. the joysticks). UI sits
      // above the canvas; if the actual target isn't the canvas, skip.
      const target = e.target as HTMLElement
      if (target.tagName !== 'CANVAS') return
      dragging = true
      pointerId = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      try {
        target.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    function onMove(e: PointerEvent) {
      if (!dragging || e.pointerId !== pointerId) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      const s = useGameStore.getState()
      s.addCameraYaw(dx * YAW_DRAG_FACTOR)
      s.setCameraPitch(s.cameraPitch - dy * PITCH_DRAG_FACTOR)
    }

    function onUp(e: PointerEvent) {
      if (!dragging || e.pointerId !== pointerId) return
      dragging = false
      pointerId = -1
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [targetRef])
}
