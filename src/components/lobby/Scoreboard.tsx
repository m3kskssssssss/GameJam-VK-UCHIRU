'use client'
// Phase 7 — Scoreboard: timer + players ranked by score.

import type { MatchState } from '@/server/actions/lobby-helpers'
import { ru } from '@/i18n/ru'

const t = ru.lobby

interface Props {
  state: MatchState
}

export function Scoreboard({ state }: Props) {
  const { me, players, timeLeftMs } = state
  const secondsLeft = Math.ceil(timeLeftMs / 1000)

  return (
    <div className="flex items-start justify-between gap-2 rounded-xl bg-white/10 px-3 py-2">
      {/* Timer */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400">{t.timeLeft}</span>
        <span
          className={`text-2xl font-extrabold tabular-nums leading-none ${
            secondsLeft <= 10 ? 'text-red-400' : 'text-white'
          }`}
        >
          {secondsLeft}
        </span>
        <span className="text-xs text-gray-400">сек</span>
      </div>

      {/* Player scores */}
      <ol className="flex flex-1 flex-wrap justify-end gap-1.5">
        {players.map((p, i) => {
          const isMe = p.childId === me.childId
          return (
            <li
              key={p.childId}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isMe
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-200'
              }`}
            >
              <span className="opacity-60">{i + 1}.</span>
              <span className="max-w-[5rem] truncate">{p.displayName}</span>
              <span className="font-extrabold">{p.score}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
