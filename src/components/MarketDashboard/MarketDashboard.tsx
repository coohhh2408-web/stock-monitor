import { useMemo, useState } from 'react'
import { StockSearchBar } from './StockSearchBar'
import { QuoteCard } from './QuoteCard'
import { StockDetailPanel } from './StockDetailPanel'
import { InfoCenter } from './InfoCenter'
import { StrikeZone } from './StrikeZone'
import { Shelf } from '@/components/ui/Shelf'
import { useAppStore } from '@/store/AppStore'
import { useStockSearch } from '@/hooks/useStockSearch'
import { sessionLabel } from '@/lib/marketHours'
import type { MarketCategory, QuoteItem } from '@/types/market'

export function MarketDashboard({ isMobile = false }: { isMobile?: boolean }) {
  const { quotes, addStock, removeStock, toggleWatchlist, getSparkline, reorderQuotes, quoteFeed } = useAppStore()
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

  const showEmptyHint = filteredQuotes.length === 0 && searchQuery.trim().length > 0
  const mood =
    quoteFeed.status === 'error'
      ? '行情暂不可用'
      : quoteFeed.status === 'mock'
        ? '模拟行情'
        : sessionLabel(quotes)

  const handleRemove = (quoteId: string) => {
    if (window.confirm('确定从看板移除此标的？相关提醒规则也会删除。')) {
      removeStock(quoteId)
    }
  }

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-[34px] font-bold tracking-tight text-neutral-900 leading-none">行情</h1>
        <p className="text-[15px] text-neutral-500 mt-2">{mood}</p>
      </header>

      <StockSearchBar
        category={category}
        searchQuery={searchQuery}
        existingCodes={existingCodes}
        isMobile={isMobile}
        onCategoryChange={setCategory}
        onSearchChange={setSearchQuery}
        onAddStock={addStock}
      />

      {isMobile ? (
        filteredQuotes.length > 0 && (
          <Shelf title="继续看">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                variant="shelf"
                sparkline={getSparkline(quote.code, quote.price)}
                onOpen={() => openDetail(quote)}
                onNewsClick={() => openDetail(quote)}
                onToggleWatchlist={() => toggleWatchlist(quote.id)}
                onRemove={() => handleRemove(quote.id)}
              />
            ))}
          </Shelf>
        )
      ) : (
        filteredQuotes.length > 0 && (
          <section className="mt-2">
            <h2 className="text-[22px] font-bold tracking-tight text-neutral-900 mb-3">继续看</h2>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredQuotes.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  variant="shelf"
                  className="!flex-none !max-w-none w-full"
                  sparkline={getSparkline(quote.code, quote.price)}
                  onOpen={() => openDetail(quote)}
                  onNewsClick={() => openDetail(quote)}
                  onToggleWatchlist={() => toggleWatchlist(quote.id)}
                  onRemove={() => handleRemove(quote.id)}
                  onReorder={reorderQuotes}
                />
              ))}
            </div>
          </section>
        )
      )}

      {hiddenByFilter && (
        <div className="mt-4 lockup-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[15px] text-neutral-800">「{hiddenByFilter.name}」已在看板中</p>
            <p className="text-[13px] text-neutral-400 mt-0.5">当前分类下不可见</p>
          </div>
          <button
            onClick={() => setCategory('all')}
            className="text-[15px] font-medium text-[#007AFF] shrink-0"
          >
            查看全部
          </button>
        </div>
      )}

      {showEmptyHint && catalogHits.length > 0 && (
        <div className="mt-4 lockup-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[15px] text-neutral-800">找到 {catalogHits[0].name}</p>
            <p className="text-[13px] text-neutral-400 font-mono tabular mt-0.5">{catalogHits[0].code}</p>
          </div>
          <button
            onClick={() => addStock(catalogHits[0])}
            className="text-[15px] font-medium text-[#007AFF]"
          >
            加入
          </button>
        </div>
      )}

      {filteredQuotes.length === 0 && !showEmptyHint && !hiddenByFilter && (
        <div className="lockup-card mt-4 px-5 py-14 text-center">
          <p className="text-[17px] font-semibold text-neutral-900">还没有标的</p>
          <p className="text-[15px] text-neutral-400 mt-2">搜索代码或名称，滑过来一张卡片</p>
        </div>
      )}

      {filteredQuotes.length === 0 && showEmptyHint && catalogHits.length === 0 && !hiddenByFilter && (
        <div className="lockup-card mt-4 px-5 py-12 text-center">
          <p className="text-[17px] text-neutral-500">未找到「{searchQuery}」</p>
        </div>
      )}

      {quotes.length > 0 && (
        <StrikeZone quotes={quotes} isMobile={isMobile} onOpen={openDetail} />
      )}

      {filteredQuotes.length > 0 && (
        <InfoCenter quotes={quotes} isMobile={isMobile} onTagClick={openDetailByName} />
      )}

      <StockDetailPanel
        isOpen={panelOpen}
        stock={selectedStock}
        onClose={() => setPanelOpen(false)}
        isMobile={isMobile}
      />
    </div>
  )
}
