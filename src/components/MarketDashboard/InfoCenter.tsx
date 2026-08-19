import { useEffect, useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/lib/utils'
import { fetchFlashNews, fetchWatchlistNews } from '@/services/newsApi'
import type { AnnouncementItem, QuoteItem, SentimentTag } from '@/types/market'

const SENTIMENT_DOT: Record<SentimentTag, string> = {
  bullish: 'bg-[#FF3B30]',
  bearish: 'bg-[#34C759]',
  neutral: 'bg-neutral-300',
}

export function InfoCenter({
  quotes,
  isMobile = false,
  onTagClick,
}: {
  quotes: QuoteItem[]
  isMobile?: boolean
  onTagClick: (name: string) => void
}) {
  const [watchlist, setWatchlist] = useState<AnnouncementItem[]>([])
  const [flash, setFlash] = useState<AnnouncementItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'watchlist' | 'flash'>('flash')

  const quoteKey = quotes.map((q) => `${q.code}:${q.isWatchlisted ? 1 : 0}`).join('|')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [watch, live] = await Promise.all([
          fetchWatchlistNews(quotes),
          fetchFlashNews(quotes),
        ])
        if (cancelled) return
        setWatchlist(watch.slice(0, 12))
        setFlash(live.slice(0, 16))
        setUpdatedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
      } catch {
        if (!cancelled) setFlash([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const id = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey])

  return (
    <section className={isMobile ? 'mt-6' : 'mt-8'}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[15px] font-semibold text-neutral-900">资讯中心</h2>
        <span className="text-[11px] text-neutral-400 tabular shrink-0">
          {updatedAt ? `更新 ${updatedAt}` : '自动刷新'}
        </span>
      </div>

      {isMobile ? (
        <>
          <SegmentedControl
            fullWidth
            value={tab}
            onChange={setTab}
            options={[
              { value: 'watchlist', label: '自选资讯' },
              { value: 'flash', label: '7×24 快讯' },
            ]}
            className="mb-3"
          />
          <NewsFeed
            items={(tab === 'watchlist' ? watchlist : flash).slice(0, 12)}
            loading={loading}
            empty={tab === 'watchlist' ? '暂无自选相关资讯' : '快讯暂不可用'}
            onTagClick={onTagClick}
          />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 items-start">
          <div>
            <p className="text-[12px] font-medium text-neutral-500 mb-2 px-0.5">自选资讯 · F10 / 研报</p>
            <NewsFeed
              items={watchlist.slice(0, 10)}
              loading={loading}
              empty="暂无自选相关资讯"
              onTagClick={onTagClick}
            />
          </div>
          <div>
            <p className="text-[12px] font-medium text-neutral-500 mb-2 px-0.5">7×24 快讯</p>
            <NewsFeed
              items={flash.slice(0, 12)}
              loading={loading}
              empty="快讯暂不可用"
              onTagClick={onTagClick}
            />
          </div>
        </div>
      )}
    </section>
  )
}

function NewsFeed({
  items,
  loading,
  empty,
  onTagClick,
}: {
  items: AnnouncementItem[]
  loading: boolean
  empty: string
  onTagClick: (name: string) => void
}) {
  return (
    <div className="info-card !p-0 overflow-hidden">
      {loading && items.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">正在拉取资讯…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">{empty}</p>
      ) : (
        <ul>
          {items.map((item, i) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-2 px-3.5 h-11',
                i < items.length - 1 && 'border-b border-black/[0.04]',
              )}
            >
              <span
                className={cn('w-1.5 h-1.5 rounded-full shrink-0', SENTIMENT_DOT[item.sentiment ?? 'neutral'])}
                aria-hidden
              />
              <span className="text-[11px] text-neutral-400 tabular w-10 shrink-0">{item.date}</span>
              {item.tag && (
                <button
                  onClick={() => onTagClick(item.tag!)}
                  className="text-[11px] font-medium text-[#007AFF] shrink-0 max-w-[4.5rem] truncate"
                >
                  {item.tag}
                </button>
              )}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 text-[13px] text-neutral-800 truncate hover:text-[#007AFF]"
                >
                  {item.title}
                </a>
              ) : (
                <p className="flex-1 min-w-0 text-[13px] text-neutral-800 truncate">{item.title}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
