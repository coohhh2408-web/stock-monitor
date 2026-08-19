import { cn } from '@/lib/utils'

export function ChangeCapsule({
  change,
  changePercent,
  compact = false,
}: {
  change: number
  changePercent: number
  compact?: boolean
}) {
  const isUp = change >= 0
  const sign = isUp ? '+' : ''
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white tabular leading-none',
        isUp ? 'bg-[#FF3B30]' : 'bg-[#34C759]',
      )}
    >
      {compact
        ? `${sign}${changePercent.toFixed(2)}%`
        : `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`}
    </span>
  )
}

export function MarketTag({ market, badge = false }: { market: string; badge?: boolean }) {
  const labels: Record<string, string> = {
    'a-share': 'A股',
    'hk-stock': '港股',
    'us-stock': '美股',
    futures: '国际期货',
  }
  const label = labels[market] ?? market
  if (!badge) {
    return <span className="text-xs text-neutral-400 font-mono">{label}</span>
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#F2F3F5] px-2 py-0.5 text-[10px] font-medium text-neutral-500">
      {label}
    </span>
  )
}

export function SentimentTag({ sentiment }: { sentiment: 'bullish' | 'bearish' | 'neutral' }) {
  const styles = {
    bullish: 'bg-red-500/10 text-red-600',
    bearish: 'bg-green-500/10 text-green-600',
    neutral: 'bg-neutral-500/10 text-neutral-500',
  }
  const labels = { bullish: '利好', bearish: '利空', neutral: '中性' }
  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium', styles[sentiment])}>
      {labels[sentiment]}
    </span>
  )
}

export function PillButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full font-medium transition-colors',
        className,
      )}
    >
      {children}
    </button>
  )
}
