import { useState, useEffect } from 'react'
import { SentimentTag } from '@/components/ui/StocksPrimitives'
import { KlineChart } from '@/components/ui/KlineChart'
import { QuoteStatsGrid } from './QuoteStatsGrid'
import { BuffettMungerBrief } from './BuffettMungerBrief'
import { Shelf } from '@/components/ui/Shelf'
import { cn, formatPrice, getChangeColor } from '@/lib/utils'
import { lightTap } from '@/lib/nativeInit'
import { fetchFlashNews, fetchStockNews } from '@/services/newsApi'
import { fetchChartSeries, fetchQuoteSnapshot } from '@/services/klineApi'
import { fetchFinancials } from '@/services/financialsApi'
import type { QuoteItem, AnnouncementItem, ChartPeriod, FinancialsPack, KlineBar } from '@/types/market'

const PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: 'intraday', label: '分时' },
  { value: '5d', label: '5日' },
  { value: 'day', label: '日K' },
  { value: 'week', label: '周K' },
  { value: 'month', label: '月K' },
]

interface StockDetailPanelProps {
  isOpen: boolean
  stock: QuoteItem | null
  onClose: () => void
  isMobile?: boolean
}

export function StockDetailPanel({
  isOpen,
  stock,
  onClose,
  isMobile = false,
}: StockDetailPanelProps) {
  const [selectedNews, setSelectedNews] = useState<AnnouncementItem | null>(null)
  const [visible, setVisible] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [period, setPeriod] = useState<ChartPeriod>('day')
  const [snapshot, setSnapshot] = useState<QuoteItem | null>(null)
  const [bars, setBars] = useState<KlineBar[]>([])
  const [prevClose, setPrevClose] = useState<number | undefined>()
  const [chartLoading, setChartLoading] = useState(false)
  const [financials, setFinancials] = useState<FinancialsPack | null>(null)
  const [financialsStatus, setFinancialsStatus] = useState<'loading' | 'ready' | 'empty'>('empty')

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setSelectedNews(null)
      setPeriod('day')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !stock) return
    let cancelled = false
    setAnnouncements([])
    void Promise.all([
      fetchStockNews(stock),
      fetchFlashNews([stock]),
    ]).then(([f10, flash]) => {
      if (cancelled) return
      const related = flash.filter(
        (item) => item.title.includes(stock.name) || item.title.includes(stock.code) || item.tag === stock.name,
      )
      const merged = [...f10]
      for (const item of related) {
        if (!merged.some((m) => m.title === item.title)) merged.push(item)
      }
      setAnnouncements(merged)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, stock?.code, stock?.name])

  useEffect(() => {
    if (!isOpen || !stock) return
    let cancelled = false
    setSnapshot(null)
    void fetchQuoteSnapshot(stock).then((live) => {
      if (!cancelled) setSnapshot(live)
    }).catch(() => {
      if (!cancelled) setSnapshot(stock)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, stock?.code])

  useEffect(() => {
    if (!isOpen || !stock) return
    let cancelled = false
    setFinancials(null)
    setFinancialsStatus('loading')
    void fetchFinancials(stock)
      .then((pack) => {
        if (cancelled) return
        setFinancials(pack)
        setFinancialsStatus(pack ? 'ready' : 'empty')
      })
      .catch(() => {
        if (cancelled) return
        setFinancials(null)
        setFinancialsStatus('empty')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, stock?.code, stock?.market])

  useEffect(() => {
    if (!isOpen || !stock) return
    let cancelled = false
    setChartLoading(true)
    setBars([])
    void fetchChartSeries(stock, period)
      .then((result) => {
        if (cancelled) return
        setBars(result.bars)
        setPrevClose(result.prevClose)
      })
      .catch(() => {
        if (!cancelled) setBars([])
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, stock?.code, period])

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && (selectedNews ? setSelectedNews(null) : onClose())
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, selectedNews, onClose])

  if (!visible || !stock) return null

  const display = snapshot
    ? { ...snapshot, price: stock.price, change: stock.change, changePercent: stock.changePercent }
    : stock
  const newsItems = announcements.filter((a) => a.type === 'news')
  const reportItems = announcements.filter((a) => a.type === 'announcement')
  const changeColor = getChangeColor(display.change)
  const sign = display.change >= 0 ? '+' : ''

  return (
    <div className={cn('apple-modal-backdrop', isMobile && 'mobile-sheet')} onClick={onClose}>
      <div
        className={cn(
          'apple-modal flex flex-col',
          isMobile ? 'mobile-sheet-panel' : 'max-h-[min(92vh,860px)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-neutral-300" />
          </div>
        )}
        <div className={cn('flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain', isMobile ? 'px-4 pb-10 pt-1' : 'px-6 pt-6 pb-6')}>
        <div className="lockup-card p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold text-neutral-900 leading-tight tracking-tight truncate">{display.name}</h2>
              <p className="text-[13px] text-neutral-500 mt-0.5 tabular">{display.code}</p>
            </div>
            <button
              onClick={() => {
                void lightTap()
                onClose()
              }}
              aria-label="关闭"
              className="w-8 h-8 rounded-full bg-[#787880]/16 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="#636366" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="text-[40px] font-semibold tabular tracking-tight text-neutral-900 leading-none mt-4">
            {formatPrice(display.price)}
          </p>
          <p className={cn('text-[17px] font-medium tabular mt-2', changeColor)}>
            {sign}{display.change.toFixed(2)}
            <span className="ml-2">{sign}{display.changePercent.toFixed(2)}%</span>
          </p>

          <div className="period-tabs mt-5">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  void lightTap()
                  setPeriod(item.value)
                }}
                className={cn(
                  'flex-1 py-1 text-[13px] font-semibold transition-colors active:opacity-60',
                  period === item.value ? changeColor : 'text-neutral-400',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <KlineChart
            bars={bars}
            period={period}
            prevClose={prevClose ?? display.prevClose}
            loading={chartLoading}
            className="mt-2"
          />
        </div>

        <div className="mb-4">
          <QuoteStatsGrid stock={display} financials={financials} />
        </div>

        <h2 className="text-[22px] font-bold tracking-tight text-neutral-900 mb-3 px-0.5">价值清单</h2>
        <BuffettMungerBrief stock={display} financials={financials} financialsStatus={financialsStatus} />

        {newsItems.length > 0 && (
          <Shelf title="快讯" className="mt-5">
            {newsItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  void lightTap()
                  setSelectedNews(item)
                }}
                className="shelf-card lockup-card press-float text-left p-5 min-h-[132px]"
              >
                <p className="text-[13px] text-neutral-400 tabular">{item.date}</p>
                <p className="text-[17px] font-semibold text-neutral-900 leading-snug mt-2 line-clamp-3">{item.title}</p>
              </button>
            ))}
          </Shelf>
        )}

        {reportItems.length > 0 && (
          <Shelf title="公告" className="mt-2">
            {reportItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  void lightTap()
                  setSelectedNews(item)
                }}
                className="shelf-card lockup-card press-float text-left p-5 min-h-[132px]"
              >
                <p className="text-[13px] text-neutral-400 tabular">{item.date}</p>
                <p className="text-[17px] font-semibold text-neutral-900 leading-snug mt-2 line-clamp-3">{item.title}</p>
              </button>
            ))}
          </Shelf>
        )}

        {selectedNews && (
          <div className="lockup-card p-5 mt-3">
            {selectedNews.sentiment && <SentimentTag sentiment={selectedNews.sentiment} />}
            <h4 className="text-[17px] font-semibold text-neutral-900 mt-2 leading-snug">{selectedNews.title}</h4>
            <p className="text-[13px] text-neutral-400 tabular mt-1">{selectedNews.date}</p>
            <p className="text-[15px] text-neutral-600 leading-relaxed mt-3">
              {getNewsBody(selectedNews, display)}
            </p>
            {selectedNews.url && (
              <a
                href={selectedNews.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-[15px] font-medium text-[#007AFF]"
              >
                查看原文
              </a>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

function getNewsBody(item: AnnouncementItem, stock: QuoteItem): string {
  if (item.summary && item.summary !== item.title) return item.summary
  if (item.type === 'announcement') {
    return `${stock.name}（${stock.code}）发布重要公告：${item.title}。请投资者关注后续披露，理性分析对基本面的影响。`
  }
  return `【${stock.name}】${item.title}。当前股价 ${stock.price.toFixed(2)}，涨跌 ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%。`
}
