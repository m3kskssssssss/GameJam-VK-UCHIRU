// Phase 7 — Lobby landing page (server component).
// Shows a single "game house" tile with link to the arena.

import Link from 'next/link'
import { requireChild } from '@/server/auth/guards'
import { ru } from '@/i18n/ru'

const t = ru.lobby

export default async function LobbyPage() {
  await requireChild()

  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-green-300 to-green-600 px-4">
      {/* Grass texture dots overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header plaque */}
      <div className="relative z-10 mb-8 rounded-2xl bg-white/80 px-6 py-3 text-center shadow-lg backdrop-blur-sm">
        <h1 className="text-2xl font-extrabold text-gray-800">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.subtitle}</p>
      </div>

      {/* Game house card */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* House illustration */}
        <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-amber-200 shadow-xl ring-4 ring-amber-400 sm:h-44 sm:w-44">
          <span className="text-7xl select-none sm:text-8xl" role="img" aria-label="house">
            🏠
          </span>
        </div>

        <p className="max-w-xs text-center text-sm font-semibold text-white drop-shadow">
          {t.arenaHint}
        </p>

        <Link
          href="/play/lobby/arena"
          className="rounded-xl bg-blue-500 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-600 active:scale-95"
        >
          {t.enterArena}
        </Link>
      </div>

      {/* Back button */}
      <Link
        href="/play"
        className="relative z-10 mt-12 rounded-xl bg-white/80 px-6 py-2 text-sm font-semibold text-gray-700 shadow backdrop-blur-sm transition hover:bg-white active:scale-95"
      >
        {t.back}
      </Link>
    </main>
  )
}
