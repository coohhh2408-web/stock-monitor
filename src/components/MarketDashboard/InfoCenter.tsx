import { useEffect, useState } from 'react'
import { Shelf } from '@/components/ui/Shelf'
import { cn } from '@/lib/utils'
import { lightTap } from '@/lib/nativeInit'
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
  const [loading, setLoading] = useState(true)

  const quoteKey = quotes.map((q) => `${q.code}:${q.isWatchlisted ? 1 : 0}`).join('|')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [watch, live] = await Promise.allSettled([
          fetchWatchlistNews(quotes),
          fetchFlashNews(quotes),
        ])
        if (cancelled) return
        if (watch.status === 'fulfilled') setWatchlist(watch.value.slice(0, 12))
        if (live.status === 'fulfilled') setFlash(live.value.slice(0, 16))
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

  if (isMobile) {
    const items = (flash.length > 0 ? flash : watchlist).slice(0, 12)
    return (
      <Shelf title="资讯">
        {loading && items.length === 0 ? (
          <div className="shelf-card lockup-card px-5 py-10 text-[15px] text-neutral-400">正在拉取资讯…</div>
        ) : items.length === 0 ? (
          <div className="shelf-card lockup-card px-5 py-10 text-[15px] text-neutral-400">暂无快讯</div>
        ) : (
          items.map((item) => (
            <NewsCard key={item.id} item={item} onTagClick={onTagClick} />
          ))
        )}
      </Shelf>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="text-[22px] font-bold tracking-tight text-neutral-900 mb-3">资讯</h2>
      <div className="grid grid-cols-2 gap-4 items-start">
        <NewsFeed
          items={watchlist.slice(0, 10)}
          loading={loading}
          empty="暂无自选相关资讯"
          onTagClick={onTagClick}
        />
        <NewsFeed
          items={flash.slice(0, 12)}
          loading={loading}
          empty="快讯暂不可用"
          onTagClick={onTagClick}
        />
      </div>
    </section>
  )
}

function NewsCard({
  item,
  onTagClick,
}: {
  item: AnnouncementItem
  onTagClick: (name: string) => void
}) {
  const open = () => {
    void lightTap()
    if (item.tag) onTagClick(item.tag)
    else if (item.url) window.open(item.url, '_blank', 'noreferrer')
  }

  return (
    <button
      type="button"
      onClick={open}
      className="shelf-card lockup-card press-float text-left p-5 min-h-[148px] flex flex-col"
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', SENTIMENT_DOT[item.sentiment ?? 'neutral'])} />
        <span className="text-[13px] text-neutral-400 tabular truncate">
          {item.tag ? `${item.tag}  ·  ${item.date}` : item.date}
        </span>
      </div>
      <p className="text-[17px] font-semibold text-neutral-900 leading-snug mt-3 line-clamp-4">
        {item.title}
      </p>
    </button>
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
    <div className="lockup-card overflow-hidden">
      {loading && items.length === 0 ? (
        <p className="text-[15px] text-neutral-400 py-8 text-center">正在拉取资讯…</p>
      ) : items.length === 0 ? (
        <p className="text-[15px] text-neutral-400 py-8 text-center">{empty}</p>
      ) : (
        <ul>
          {items.map((item, i) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-2 px-4 h-12',
                i < items.length - 1 && 'border-b border-black/[0.06]',
              )}
            >
              <span
                className={cn('w-1.5 h-1.5 rounded-full shrink-0', SENTIMENT_DOT[item.sentiment ?? 'neutral'])}
                aria-hidden
              />
              <span className="text-[13px] text-neutral-400 tabular w-10 shrink-0">{item.date}</span>
              {item.tag && (
                <button
                  onClick={() => onTagClick(item.tag!)}
                  className="text-[13px] font-medium text-[#007AFF] shrink-0 max-w-[4.5rem] truncate"
                >
                  {item.tag}
                </button>
              )}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 text-[15px] text-neutral-800 truncate hover:text-[#007AFF]"
                >
                  {item.title}
                </a>
              ) : (
                <p className="flex-1 min-w-0 text-[15px] text-neutral-800 truncate">{item.title}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
