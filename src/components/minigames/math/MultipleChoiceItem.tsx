'use client'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MultipleChoiceItemProps {
  options: string[]
  onSelect: (answer: string) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MultipleChoiceItem({
  options,
  onSelect,
  disabled = false,
}: MultipleChoiceItemProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className="
            min-h-[56px] w-full rounded-[0.75rem]
            bg-[--color-muted] border border-[--color-border]
            text-[--color-foreground] font-semibold text-lg
            px-4 py-3
            hover:bg-[--color-primary] hover:text-white hover:border-[--color-primary]
            active:scale-[0.97]
            transition-colors duration-100
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
          "
        >
          {option}
        </button>
      ))}
    </div>
  )
}
