'use client'
// Shared input wiring used by every 3D scene:
//  - WASD/arrow movement (sets velocity in store)
//  - Mouse drag with primary button on the canvas → camera yaw/pitch
//  - Q/E keys → camera yaw
//
// Keys are matched by `e.code` (physical layout) rather than `e.key` so the
// game still steers when the user has a Russian / Chinese / etc. layout
// active — `e.key` would return "ц"/"ф"/"ы"/"в" for the W/A/S/D positions
// on a Russian layout, which the old keymap-based code didn't recognise.

import { useEffect } from 'react'
import { useGameStore } from '@/hooks/useGameStore'

const YAW_KEY_RATE = 1.8 // rad/s
const YAW_DRAG_FACTOR = 0.0055
const PITCH_DRAG_FACTOR = 0.0035

type Action = 'up' | 'down' | 'left' | 'right' | 'jump' | 'run' | 'yawLeft' | 'yawRight'

function actionFor(code: string): Action | null {
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      return 'up'
    case 'KeyS':
    case 'ArrowDown':
      return 'down'
    case 'KeyA':
    case 'ArrowLeft':
      return 'left'
    case 'KeyD':
    case 'ArrowRight':
      return 'right'
    case 'Space':
      return 'jump'
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'run'
    case 'KeyQ':
      return 'yawLeft'
    case 'KeyE':
      return 'yawRight'
    default:
      return null
  }
}

export function useSceneInput(targetRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const setVelocity = useGameStore.getState().setVelocity
    const held = new Set<Action>()

    function compute() {
      let vx = 0
      let vz = 0
      if (held.has('left')) vx -= 1
      if (held.has('right')) vx += 1
      if (held.has('up')) vz -= 1
      if (held.has('down')) vz += 1
      setVelocity(vx, vz)
    }

    function down(e: KeyboardEvent) {
      const action = actionFor(e.code)
      if (!action) return

      // Stop the browser from scrolling on Space / arrow keys while we're
      // in a 3D scene — only block these specific keys so other shortcuts
      // (Cmd-R, F5 etc.) still work normally.
      if (action === 'up' || action === 'down' || action === 'left' || action === 'right' || action === 'jump') {
        e.preventDefault()
      }

      if (action === 'jump' && !e.repeat) {
        useGameStore.getState().jump()
        return
      }
      if (action === 'run' && !e.repeat) {
        useGameStore.getState().setRunning(true)
      }
      held.add(action)
      compute()
    }

    function up(e: KeyboardEvent) {
      const action = actionFor(e.code)
      if (!action) return
      if (action === 'run') {
        useGameStore.getState().setRunning(false)
      }
      held.delete(action)
      compute()
    }

    // Window may lose focus mid-press (alt-tab, devtools focus, etc.) — when
    // it comes back the keyup we missed never fires. Clear on blur so we
    // don't strafe forever.
    function clearAll() {
      held.clear()
      setVelocity(0, 0)
      useGameStore.getState().setRunning(false)
    }

    // Yaw via Q/E keys — integrate in rAF for smooth rate.
    let rafId: number | null = null
    let last = performance.now()
    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let yawDelta = 0
      if (held.has('yawLeft')) yawDelta -= YAW_KEY_RATE * dt
      if (held.has('yawRight')) yawDelta += YAW_KEY_RATE * dt
      if (yawDelta !== 0) {
        useGameStore.getState().addCameraYaw(yawDelta)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clearAll)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clearAll)
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
