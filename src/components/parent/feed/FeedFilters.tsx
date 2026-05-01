'use client'
// FeedFilters — search input + optional child filter.
// Debounces search by 300ms. Child filter only shown if >1 child.
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ru } from '@/i18n/ru'

const { parent: p } = ru

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedFiltersProps {
  childrenList: { id: string; displayName: string }[]
  onSearchChange: (value: string) => void
  onChildChange: (childId: string | undefined) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedFilters({
  childrenList,
  onSearchChange,
  onChildChange,
}: FeedFiltersProps) {
  const [search, setSearch] = useState('')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, onSearchChange])

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={p.feed.searchPlaceholder}
        aria-label={p.feed.searchPlaceholder}
        className="flex-1"
      />

      {childrenList.length > 1 && (
        <select
          onChange={(e) =>
            onChildChange(e.target.value === '' ? undefined : e.target.value)
          }
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Фильтр по ребёнку"
        >
          <option value="">{p.feed.filterAllChildren}</option>
          {childrenList.map((child) => (
            <option key={child.id} value={child.id}>
              {child.displayName}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
