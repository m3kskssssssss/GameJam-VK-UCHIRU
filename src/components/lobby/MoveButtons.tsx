'use client'
// Phase 7 — On-screen directional buttons for mobile touch input.
// Renders 4 directional buttons (↑ ↓ ← →) in a D-pad layout.

interface Props {
  onMove: (dx: -1 | 0 | 1, dy: -1 | 0 | 1) => void
}

interface DirButton {
  label: string
  dx: -1 | 0 | 1
  dy: -1 | 0 | 1
  gridArea: string
}

const BUTTONS: DirButton[] = [
  { label: '↑', dx: 0, dy: -1, gridArea: 'up' },
  { label: '←', dx: -1, dy: 0, gridArea: 'left' },
  { label: '↓', dx: 0, dy: 1, gridArea: 'down' },
  { label: '→', dx: 1, dy: 0, gridArea: 'right' },
]

export function MoveButtons({ onMove }: Props) {
  return (
    <div
      className="flex justify-center pb-2"
      aria-label="Управление"
      role="group"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: `
            ".    up   ."
            "left down right"
          `,
          gridTemplateColumns: '3rem 3rem 3rem',
          gridTemplateRows: '3rem 3rem',
          gap: '4px',
        }}
      >
        {BUTTONS.map(({ label, dx, dy, gridArea }) => (
          <button
            key={gridArea}
            aria-label={label}
            style={{ gridArea }}
            className="flex items-center justify-center rounded-xl bg-white/20 text-xl font-bold text-white shadow active:bg-white/40 select-none"
            onPointerDown={(e) => {
              e.preventDefault()
              onMove(dx, dy)
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
