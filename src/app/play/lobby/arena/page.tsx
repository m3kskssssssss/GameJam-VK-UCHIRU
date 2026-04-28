// Phase 7 — Arena page (server component).
// Joins (or re-joins) a match, fetches initial state, renders Arena client component.

import { requireChild } from '@/server/auth/guards'
import { joinOrCreateMatch, getMatchState } from '@/server/actions/lobby'
import { Arena } from '@/components/lobby/Arena'

export default async function ArenaPage() {
  await requireChild()

  const { matchId } = await joinOrCreateMatch()
  const initialState = await getMatchState({ matchId })

  return (
    <main className="flex min-h-dvh w-full flex-col bg-gray-900 text-white">
      <Arena matchId={matchId} initialState={initialState} />
    </main>
  )
}
