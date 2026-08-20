import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useStockSearch } from '@/hooks/useStockSearch'
import type { MarketCategory, StockCatalogEntry } from '@/types/market'

const FILTER_OPTIONS: { value: MarketCategory; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'a-share', label: 'A股' },
  { value: 'hk-stock', label: '港股' },
  { value: 'us-stock', label: '美股' },
  { value: 'futures', label: '国际期货' },
  { value: 'watchlist', label: '自选' },
]

const MARKET_LABEL: Record<string, string> = {
  'a-share': 'A股',
  'hk-stock': '港股',
  'us-stock': '美股',
  futures: '国际期货',
}

interface StockSearchBarProps {
  category: MarketCategory
  searchQuery: string
  existingCodes: string[]
  isMobile?: boolean
  onCategoryChange: (category: MarketCategory) => void
  onSearchChange: (query: string) => void
  onAddStock: (entry: StockCatalogEntry) => boolean | Promise<boolean>
}

export function StockSearchBar({
  category,
  searchQuery,
  existingCodes,
  isMobile = false,
  onCategoryChange,
  onSearchChange,
  onAddStock,
}: StockSearchBarProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { hits: suggestions, loading } = useStockSearch(searchQuery, existingCodes)

  const showDropdown = focused && searchQuery.trim().length > 0

  const handleAdd = (entry: StockCatalogEntry) => {
    onAddStock(entry)
    onSearchChange('')
    setFocused(false)
    inputRef.current?.blur()
  }

  const handleAddFirst = () => {
    if (suggestions[0]) handleAdd(suggestions[0])
    else if (searchQuery.trim()) inputRef.current?.focus()
  }

  return (
    <div className="mb-4 space-y-3">
      <div className={isMobile ? 'relative' : 'relative flex gap-2 items-stretch'}>
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 14 14" fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder={isMobile ? '添加股票' : '输入股票代码或名称，如：002938 / 洛阳钼业 / AAPL / 伦铜...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) {
                e.preventDefault()
                handleAdd(suggestions[0])
              }
            }}
            className={cn(
              'w-full pl-9 pr-4 text-sm placeholder:text-neutral-400 focus:outline-none',
              isMobile
                ? 'py-2.5 rounded-[12px] bg-black/[0.06]'
                : 'py-2.5 rounded-2xl glass-control focus:ring-2 focus:ring-[#007AFF]/20 transition-shadow',
            )}
          />
        </div>

        {!isMobile && (
          <button
            onClick={handleAddFirst}
            disabled={!searchQuery.trim()}
            className="shrink-0 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#0066DD] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-[0_2px_12px_rgba(0,122,255,0.25)]"
          >
            <span className="text-base leading-none">+</span>
            加入看板
          </button>
        )}

        {showDropdown && (
          <div className={cn(
            'absolute left-0 right-0 top-full mt-1.5 z-20 bg-white overflow-hidden',
            isMobile ? 'rounded-[12px] shadow-[0_8px_28px_rgba(0,0,0,0.12)]' : 'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.04]',
          )}>
            {loading && suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-400">正在搜索全市场…</p>
            ) : suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-400">未找到「{searchQuery}」</p>
            ) : (
              suggestions.map((entry) => (
                <button
                  key={entry.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(entry)}
                  className="w-full flex items-center justify-between px-4 py-3 active:bg-neutral-100 transition-colors text-left border-b border-black/[0.04] last:border-0"
                >
                  <div>
                    <p className="text-[15px] font-medium text-neutral-900">{entry.name}</p>
                    <p className="text-[13px] text-neutral-400 font-mono tabular mt-0.5">
                      {entry.code} · {MARKET_LABEL[entry.market]}
                    </p>
                  </div>
                  <span className="text-[15px] font-medium text-[#007AFF] shrink-0 ml-3">
                    添加
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className={cn('flex', isMobile ? 'overflow-x-auto pb-0.5 -mx-1 px-1' : 'flex-wrap gap-1.5 pt-0.5')}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            className={cn(
              'font-medium transition-colors shrink-0 active:opacity-60',
              isMobile
                ? cn(
                    'pr-4 py-1 text-[15px]',
                    category === opt.value ? 'text-neutral-900' : 'text-neutral-400',
                  )
                : cn(
                    'px-2.5 py-1 rounded-full text-[11px]',
                    category === opt.value
                      ? 'bg-white/90 text-neutral-800 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-500',
                  ),
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
