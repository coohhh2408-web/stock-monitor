import { useState, useEffect } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ChangeCapsule, SentimentTag } from '@/components/ui/StocksPrimitives'
import { MiniSparkline } from '@/components/ui/MiniSparkline'
import { SkeletonText } from '@/components/ui/Skeleton'
import { cn, formatPrice } from '@/lib/utils'
import { fetchFlashNews, fetchStockNews } from '@/services/newsApi'
import type { QuoteItem, AIDiagnosisStub, AnnouncementItem, SparklineDataPoint } from '@/types/market'

type DetailTab = 'ai' | 'news24h' | 'reports'

interface StockDetailPanelProps {
  isOpen: boolean
  stock: QuoteItem | null
  sparkline: SparklineDataPoint[]
  aiDiagnosis: AIDiagnosisStub
  onClose: () => void
  onGenerateAI: () => void
  isMobile?: boolean
}

export function StockDetailPanel({
  isOpen,
  stock,
  sparkline,
  aiDiagnosis,
  onClose,
  onGenerateAI,
  isMobile = false,
}: StockDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('ai')
  const [selectedNews, setSelectedNews] = useState<AnnouncementItem | null>(null)
  const [visible, setVisible] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setTab('ai')
      setSelectedNews(null)
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

  const newsItems = announcements.filter((a) => a.type === 'news')
  const reportItems = announcements.filter((a) => a.type === 'announcement')
  const listItems = tab === 'news24h' ? newsItems : tab === 'reports' ? reportItems : []

  const hasAI = aiDiagnosis.status === 'ready' && aiDiagnosis.moatAnalysis
  const bullets = hasAI ? [
    aiDiagnosis.anomalySummary ?? '暂无异动信息',
    aiDiagnosis.moatAnalysis ?? '暂无机构观点',
    aiDiagnosis.roeDuPont ?? '暂无风险提示',
  ] : null

  return (
    <div className={cn('apple-modal-backdrop', isMobile && 'mobile-sheet')} onClick={onClose}>
      <div
        className={cn(
          'apple-modal flex flex-col',
          isMobile ? 'mobile-sheet-panel' : 'max-h-[min(85vh,680px)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-neutral-300" />
          </div>
        )}
        <div className={cn('flex flex-col flex-1 min-h-0', isMobile ? 'px-5 pb-6 pt-2' : 'p-6')}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <StockIcon name={stock.name} />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 leading-tight">{stock.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-mono tabular text-neutral-500">{formatPrice(stock.price)}</span>
                <ChangeCapsule change={stock.change} changePercent={stock.changePercent} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="#636366" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Large sparkline preview */}
        <div className="mb-5 shrink-0 flex justify-center py-2">
          <MiniSparkline data={sparkline} change={stock.change} width={280} height={64} className="opacity-90" />
        </div>

        {/* Segmented Control */}
        <SegmentedControl
          options={[
            { value: 'ai' as const, label: 'AI 异动速读' },
            { value: 'news24h' as const, label: '7×24 快讯' },
            { value: 'reports' as const, label: '公告研报' },
          ]}
          value={tab}
          onChange={setTab}
          fullWidth
          className="mb-4 shrink-0"
        />

        {/* Tab content */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          {tab === 'ai' && (
            <div className="overflow-y-auto max-h-[320px]">
              {aiDiagnosis.status === 'loading' ? (
                <div className="ai-glow-card">
                  <SkeletonText lines={4} />
                  <p className="text-xs text-neutral-400 mt-3 animate-pulse">AI 分析中…</p>
                </div>
              ) : bullets ? (
                <div className="ai-glow-card">
                  <p className="text-xs font-medium text-violet-600/80 mb-3 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 inline-block" />
                    Apple Intelligence 速读
                  </p>
                  <ul className="space-y-3">
                    {['核心异动催化', '机构观点', '风险提示'].map((label, i) => (
                      <li key={label} className="flex gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-neutral-400 mb-0.5">{label}</p>
                          <p className="text-sm text-neutral-700 leading-relaxed">{bullets[i]}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="ai-glow-card text-center py-6">
                  <p className="text-sm text-neutral-500 mb-3">生成 AI 异动速读分析</p>
                  <button
                    onClick={onGenerateAI}
                    className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    开始分析
                  </button>
                </div>
              )}
            </div>
          )}

          {(tab === 'news24h' || tab === 'reports') && (
            <div className={cn('relative overflow-hidden', isMobile ? 'max-h-[50vh]' : 'flex max-h-[320px]')}>
              <div className={cn(
                'overflow-y-auto transition-all duration-300',
                !isMobile && selectedNews && 'w-1/2 opacity-60',
              )}>
                {listItems.length === 0 ? (
                  <p className="text-center py-12 text-sm text-neutral-400">暂无内容</p>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-black/[0.04]">
                    {listItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedNews(item)}
                        className={cn(
                          'w-full text-left px-4 py-3 transition-colors border-b border-black/[0.04] last:border-0',
                          selectedNews?.id === item.id ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                        )}
                      >
                        <p className="text-sm text-neutral-900 leading-snug line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.sentiment && <SentimentTag sentiment={item.sentiment} />}
                          <span className="text-[11px] text-neutral-400 tabular">{item.date}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedNews && (
                <div className={cn(
                  'animate-slide-in overflow-y-auto',
                  isMobile ? 'mt-3' : 'w-1/2 pl-3',
                )}>
                  <div className="bg-neutral-50 rounded-xl p-4 h-full">
                    {selectedNews.sentiment && <SentimentTag sentiment={selectedNews.sentiment} />}
                    <h4 className="text-sm font-semibold text-neutral-900 mt-2 leading-snug">{selectedNews.title}</h4>
                    <p className="text-[11px] text-neutral-400 tabular mt-1">{selectedNews.date}</p>
                    <p className="text-[13px] text-neutral-600 leading-relaxed mt-3">
                      {getNewsBody(selectedNews, stock)}
                    </p>
                    {selectedNews.url && (
                      <a
                        href={selectedNews.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 text-[13px] font-medium text-[#007AFF]"
                      >
                        查看原文
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

function StockIcon({ name }: { name: string }) {
  const hue = name.charCodeAt(0) * 37 % 360
  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
      style={{ background: `linear-gradient(135deg, hsl(${hue},60%,55%), hsl(${hue},50%,45%))` }}
    >
      {name.charAt(0)}
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
