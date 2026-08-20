import { MiniSparkline } from '@/components/ui/MiniSparkline'
import { ChangeCapsule, MarketTag } from '@/components/ui/StocksPrimitives'
import { PricePlanStrip } from './PricePlanStrip'
import { cn, formatListedCode, formatPrice, formatQuotePrice } from '@/lib/utils'
import { lightTap } from '@/lib/nativeInit'
import type { QuoteItem, SparklineDataPoint } from '@/types/market'

interface QuoteCardProps {
  quote: QuoteItem
  sparkline: SparklineDataPoint[]
  variant?: 'list' | 'grid' | 'shelf'
  className?: string
  onOpen: () => void
  onNewsClick: () => void
  onToggleWatchlist: () => void
  onRemove?: () => void
  onReorder?: (fromId: string, toId: string) => void
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 12V7.5h2.2V12H3zM7 12V4.5h2.2V12H7zM11 12V8.5h2.2V12H11z" fill="currentColor" />
    </svg>
  )
}

export function QuoteCard({
  quote,
  sparkline,
  variant = 'list',
  className,
  onOpen,
  onNewsClick,
  onToggleWatchlist,
  onRemove,
  onReorder,
}: QuoteCardProps) {
  const listed = formatListedCode(quote.code, quote.market)

  if (variant === 'shelf') {
    return (
      <article
        onClick={() => {
          void lightTap()
          onOpen()
        }}
        className={cn('shelf-card lockup-card press-float relative p-5 min-h-[196px] flex flex-col', className)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[20px] font-bold text-neutral-900 truncate leading-tight tracking-tight">{quote.name}</h3>
            <p className="text-[13px] text-neutral-400 font-mono tabular mt-1">{listed}</p>
          </div>
          <ChangeCapsule change={quote.change} changePercent={quote.changePercent} compact />
        </div>
        <div className="flex-1 flex items-center my-3 pointer-events-none">
          <MiniSparkline
            data={sparkline}
            change={quote.change}
            width={240}
            height={56}
            gradientId={`shelf-${quote.id}`}
            className="w-full h-[56px]"
          />
        </div>
        <p className="text-[32px] font-semibold tracking-tight font-mono tabular text-neutral-900 leading-none">
          {formatQuotePrice(quote.price, quote.market)}
        </p>
        <PricePlanStrip quote={quote} variant="card" />
      </article>
    )
  }

  if (variant === 'grid') {
    return (
      <article
        onClick={() => {
          void lightTap()
          onOpen()
        }}
        draggable={Boolean(onReorder)}
        onDragStart={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-drag]')) {
            e.preventDefault()
            return
          }
          e.dataTransfer.setData('text/quote-id', quote.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={(e) => {
          if (!onReorder) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          if (!onReorder) return
          e.preventDefault()
          const fromId = e.dataTransfer.getData('text/quote-id')
          if (fromId && fromId !== quote.id) onReorder(fromId, quote.id)
        }}
        className="quote-card relative group min-h-[176px]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            {onReorder && (
              <span className="text-neutral-300 text-[15px] leading-5 mt-px cursor-grab select-none shrink-0" aria-hidden>
                ≡
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-neutral-900 truncate leading-tight">{quote.name}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleWatchlist() }}
                  aria-label={quote.isWatchlisted ? '移出自选' : '加入自选'}
                  className={cn(
                    'shrink-0 transition-colors',
                    quote.isWatchlisted ? 'text-[#FF9500]' : 'text-neutral-200 opacity-0 group-hover:opacity-100 hover:text-neutral-400',
                  )}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill={quote.isWatchlisted ? 'currentColor' : 'none'}>
                    <path d="M7 1.5L8.76 5.26L12.5 5.76L9.75 8.74L10.52 12.5L7 10.66L3.48 12.5L4.25 8.74L1.5 5.76L5.24 5.26L7 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-neutral-400 font-mono tabular mt-0.5">{listed}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <MarketTag market={quote.market} badge />
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                aria-label="移除"
                className="w-5 h-5 flex items-center justify-center rounded text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-colors text-[15px] leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center my-3 pointer-events-none">
          <MiniSparkline data={sparkline} change={quote.change} width={220} height={52} gradientId={quote.id} className="w-full max-w-[240px] h-[52px]" />
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="font-bold text-[26px] tracking-tight font-mono tabular text-neutral-900 leading-none">
              {formatQuotePrice(quote.price, quote.market)}
            </p>
            <div className="flex gap-2 mt-1.5 text-[10px] text-neutral-400 tabular">
              <span>开{formatPrice(quote.open)}</span>
              <span>高{formatPrice(quote.high)}</span>
              <span>低{formatPrice(quote.low)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pb-0.5">
            <ChangeCapsule change={quote.change} changePercent={quote.changePercent} compact />
            <button
              onClick={(e) => { e.stopPropagation(); onNewsClick() }}
              aria-label="个股详情"
              className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-colors"
            >
              <ChartIcon />
            </button>
          </div>
        </div>
        <PricePlanStrip quote={quote} variant="card" />
      </article>
    )
  }

  return (
    <article
      onClick={() => {
        void lightTap()
        onOpen()
      }}
      className="relative flex flex-col gap-1 px-4 py-3 bg-white border-b border-black/[0.06] last:border-0 active:bg-neutral-50"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold text-neutral-900 truncate leading-tight">{quote.name}</h3>
          <p className="text-[13px] text-neutral-400 font-mono tabular mt-0.5">{listed}</p>
        </div>
        <MiniSparkline data={sparkline} change={quote.change} width={64} height={28} gradientId={quote.id} />
        <div className="shrink-0 text-right">
          <p className="text-[17px] font-semibold font-mono tabular text-neutral-900 leading-none">
            {formatQuotePrice(quote.price, quote.market)}
          </p>
          <div className="mt-1.5 flex justify-end">
            <ChangeCapsule change={quote.change} changePercent={quote.changePercent} compact />
          </div>
        </div>
      </div>
      <PricePlanStrip quote={quote} variant="list" />
    </article>
  )
}
