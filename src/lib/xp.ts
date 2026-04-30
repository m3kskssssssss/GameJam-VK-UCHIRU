/** Virtual XP needed to fill one subject level for the visible progress bar. */
export const XP_PER_LEVEL = 100

/**
 * Compute visible XP progress within the child's current level.
 * Clamped to [0, XP_PER_LEVEL].
 */
export function xpProgressInLevel(
  totalXp: number,
  level: number,
): { current: number; needed: number } {
  const consumed = Math.max(0, (level - 1) * XP_PER_LEVEL)
  const current = Math.min(XP_PER_LEVEL, Math.max(0, totalXp - consumed))
  return { current, needed: XP_PER_LEVEL }
}
