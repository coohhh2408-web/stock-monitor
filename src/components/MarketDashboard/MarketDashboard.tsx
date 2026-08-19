import { useMemo, useState } from 'react'
import { StockSearchBar } from './StockSearchBar'
import { QuoteCard } from './QuoteCard'
import { StockDetailPanel } from './StockDetailPanel'
import { InfoCenter } from './InfoCenter'
import { useAppStore } from '@/store/AppStore'
import { useStockSearch } from '@/hooks/useStockSearch'
import type { MarketCategory, QuoteItem } from '@/types/market'

export function MarketDashboard({ isMobile = false }: { isMobile?: boolean }) {
  const { quotes, addStock, removeStock, toggleWatchlist, getSparkline, getAIDiagnosis, generateAI, reorderQuotes } = useAppStore()
  const [category, setCategory] = useState<MarketCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const existingCodes = useMemo(() => quotes.map((q) => q.code), [quotes])

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (category === 'watchlist' && !q.isWatchlisted) return false
      if (category !== 'all' && category !== 'watchlist' && q.market !== category) return false
      return true
    })
  }, [quotes, category])

  const catalogHits = useStockSearch(searchQuery, existingCodes).hits

  const hiddenByFilter = useMemo(() => {
    if (!searchQuery.trim()) return null
    const query = searchQuery.trim().toLowerCase()
    return quotes.find(
      (q) =>
        (q.name.toLowerCase().includes(query) || q.code.toLowerCase().includes(query)) &&
        !filteredQuotes.some((fq) => fq.id === q.id),
    ) ?? null
  }, [searchQuery, quotes, filteredQuotes])

  const selectedStock = useMemo(
    () => (selectedCode ? quotes.find((q) => q.code === selectedCode) ?? null : null),
    [selectedCode, quotes],
  )

  const openDetail = (stock: QuoteItem) => {
    setSelectedCode(stock.code)
    setPanelOpen(true)
  }

  const openDetailByName = (name: string) => {
    const match = quotes.find((q) => q.name.includes(name) || name.includes(q.name))
    if (match) openDetail(match)
  }

  const aiDiagnosis = selectedStock ? getAIDiagnosis(selectedStock) : { status: 'idle' as const }

  const showEmptyHint = filteredQuotes.length === 0 && searchQuery.trim().length > 0
  const cardVariant = isMobile ? 'list' : 'grid'

  const handleRemove = (quoteId: string) => {
    if (window.confirm('确定从看板移除此标的？相关提醒规则也会删除。')) {
      removeStock(quoteId)
    }
  }

  return (
    <div>
      {!isMobile && (
        <header className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-[17px] font-semibold text-neutral-800 tracking-tight">实时行情看板</h2>
          <p className="text-[11px] text-neutral-400 shrink-0">拖拽卡片左侧 ≡ 可任意位置排序</p>
        </header>
      )}

      <StockSearchBar
        category={category}
        searchQuery={searchQuery}
        existingCodes={existingCodes}
        isMobile={isMobile}
        onCategoryChange={setCategory}
        onSearchChange={setSearchQuery}
        onAddStock={addStock}
      />

      <div className={isMobile ? 'flex flex-col gap-2.5' : 'grid grid-cols-3 gap-4'}>
        {filteredQuotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            variant={cardVariant}
            sparkline={getSparkline(quote.code, quote.price)}
            onOpen={() => openDetail(quote)}
            onNewsClick={() => openDetail(quote)}
            onToggleWatchlist={() => toggleWatchlist(quote.id)}
            onRemove={() => handleRemove(quote.id)}
            onReorder={isMobile ? undefined : reorderQuotes}
          />
        ))}
      </div>

      {hiddenByFilter && (
        <div className="mt-3 stocks-card glass-card !p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">「{hiddenByFilter.name}」已在看板中</p>
            <p className="text-xs text-neutral-400 mt-0.5">当前分类筛选下不可见，可切换到「全部」查看</p>
          </div>
          <button
            onClick={() => setCategory('all')}
            className="text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full hover:bg-[#007AFF]/15 transition-colors shrink-0"
          >
            查看全部
          </button>
        </div>
      )}

      {showEmptyHint && catalogHits.length > 0 && (
        <div className="mt-3 stocks-card glass-card !p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">找到 {catalogHits[0].name}</p>
            <p className="text-xs text-neutral-400 font-mono tabular mt-0.5">{catalogHits[0].code}</p>
          </div>
          <button
            onClick={() => addStock(catalogHits[0])}
            className="text-xs font-medium text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full hover:bg-[#007AFF]/15 transition-colors"
          >
            加入看板
          </button>
        </div>
      )}

      {filteredQuotes.length === 0 && !showEmptyHint && !hiddenByFilter && (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-base">
            {searchQuery.trim() ? '暂无匹配的标的，试试搜索添加' : '暂无标的，搜索添加自选'}
          </p>
        </div>
      )}

      {filteredQuotes.length === 0 && showEmptyHint && catalogHits.length === 0 && !hiddenByFilter && (
        <div className="text-center py-16">
          <p className="text-neutral-400 text-base">未找到「{searchQuery}」</p>
          <p className="text-sm text-neutral-400 mt-1">请检查名称或代码是否正确</p>
        </div>
      )}

      {filteredQuotes.length > 0 && (
        <InfoCenter quotes={quotes} isMobile={isMobile} onTagClick={openDetailByName} />
      )}

      <StockDetailPanel
        isOpen={panelOpen}
        stock={selectedStock}
        aiDiagnosis={aiDiagnosis}
        onClose={() => setPanelOpen(false)}
        onGenerateAI={() => selectedStock && generateAI(selectedStock)}
        isMobile={isMobile}
      />
    </div>
  )
}
