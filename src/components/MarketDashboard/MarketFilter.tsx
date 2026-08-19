import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { MarketCategory } from '@/types/market'

const FILTER_OPTIONS: { value: MarketCategory; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'a-share', label: 'A股' },
  { value: 'us-stock', label: '美股' },
  { value: 'futures', label: '期货' },
  { value: 'watchlist', label: '自选' },
]

interface MarketFilterProps {
  category: MarketCategory
  searchQuery: string
  onCategoryChange: (category: MarketCategory) => void
  onSearchChange: (query: string) => void
}

export function MarketFilter({
  category,
  searchQuery,
  onCategoryChange,
  onSearchChange,
}: MarketFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <SegmentedControl options={FILTER_OPTIONS} value={category} onChange={onCategoryChange} />
      <input
        type="search"
        placeholder="搜索"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:ml-auto w-full sm:w-44 px-3 py-1.5 rounded-lg bg-neutral-200/60 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300/80 transition-shadow"
      />
    </div>
  )
}
