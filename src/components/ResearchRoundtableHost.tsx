import { useEffect, useRef, useState } from 'react'
import { StockDetailPanel } from '@/components/MarketDashboard/StockDetailPanel'
import { DEFAULT_RESEARCH_CODE } from '@/lib/appRoute'
import { STOCK_CATALOG, catalogEntryToQuote } from '@/data/stockCatalog'
import { fetchLiveQuote, searchLiveStocks } from '@/services/quoteApi'
import { scoreScreenerQuote, toScreenerPick, type ScreenerPick } from '@/services/stockScreener'
import { useAppStore } from '@/store/AppStore'
import type { QuoteItem } from '@/types/market'

export function ResearchRoundtableHost({
  code,
  isMobile,
  onClose,
}: {
  code: string | null
  isMobile: boolean
  onClose: () => void
}) {
  const { quotes } = useAppStore()
  const quotesRef = useRef(quotes)
  quotesRef.current = quotes
  const [stock, setStock] = useState<QuoteItem | null>(null)
  const [pick, setPick] = useState<ScreenerPick | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const target = (code || DEFAULT_RESEARCH_CODE).trim()

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setStock(null)
    setPick(null)

    void resolveResearchQuote(target, quotesRef.current)
      .then((quote) => {
        if (cancelled) return
        setStock(quote)
        const hit = scoreScreenerQuote(quote)
        setPick(hit ? toScreenerPick(hit, 'all') : null)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [target])

  if (status === 'error') {
    return (
      <div className="apple-modal-backdrop z-[60]" onClick={onClose}>
        <div className="apple-modal max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
          <p className="text-[17px] font-semibold text-neutral-900">圆桌暂时打不开</p>
          <p className="text-[13px] text-neutral-500 mt-2 leading-relaxed">
            {target} 没拉到行情。换一只代码，或先打开选股页点「看入选逻辑和三人短评」。
          </p>
          <button type="button" className="mt-4 text-[15px] font-medium text-[#007AFF]" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    )
  }

  if (status !== 'ready' || !stock) {
    return (
      <div className="apple-modal-backdrop z-[60]">
        <div className="apple-modal max-w-sm mx-4 p-5">
          <p className="text-[15px] text-neutral-600">正在打开三人短评…</p>
        </div>
      </div>
    )
  }

  return (
    <StockDetailPanel
      isOpen
      stock={stock}
      pick={pick}
      onClose={onClose}
      isMobile={isMobile}
      forceResearch
    />
  )
}

async function resolveResearchQuote(code: string, quotes: QuoteItem[]): Promise<QuoteItem> {
  const needle = code.toUpperCase()
  const onBoard = quotes.find((q) => q.code.toUpperCase() === needle)
  if (onBoard) return onBoard

  const catalog = STOCK_CATALOG.find((row) => row.code.toUpperCase() === needle)
  if (catalog) {
    try {
      return await fetchLiveQuote(catalog)
    } catch {
      return catalogEntryToQuote(catalog)
    }
  }

  const hits = await searchLiveStocks(code, [], 4)
  const match = hits.find((row) => row.code.toUpperCase() === needle) ?? hits[0]
  if (!match) throw new Error(`no quote for ${code}`)
  try {
    return await fetchLiveQuote(match)
  } catch {
    return catalogEntryToQuote(match)
  }
}
