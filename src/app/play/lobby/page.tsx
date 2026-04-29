// Phase 7 — Lobby landing page (server component).
// Renders a 3D world with one demo game-house. Walking near the house opens
// an "Войти в игровой домик" CTA that links to the arena.

import { requireChild } from '@/server/auth/guards'
import { LobbyWorld } from '@/components/world/LobbyWorld'

export default async function LobbyPage() {
  await requireChild()

  return (
    <div className="h-dvh w-dvw overflow-hidden">
      <LobbyWorld />
    </div>
  )
}
