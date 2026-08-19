import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'market' | 'bullish' | 'bearish' | 'neutral' | 'strategy'

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-black/[0.05] text-apple-gray-600',
  market: 'bg-apple-blue/10 text-apple-blue',
  bullish: 'bg-apple-red/[0.08] text-apple-red',
  bearish: 'bg-apple-green/[0.08] text-apple-green',
  neutral: 'bg-black/[0.05] text-apple-gray-500',
  strategy: 'bg-apple-orange/[0.08] text-apple-orange',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium leading-none',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function MarketBadge({ market }: { market: string }) {
  const labels: Record<string, string> = {
    'a-share': 'A股',
    'us-stock': '美股',
    futures: '期货',
  }
  return <Badge variant="market">{labels[market] ?? market}</Badge>
}

export function ChangeBadge({ change, changePercent }: { change: number; changePercent: number }) {
  const variant = change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral'
  const sign = change >= 0 ? '+' : ''
  return (
    <Badge variant={variant} className="tabular text-[12px] px-2.5 py-1 rounded-lg">
      {sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)
    </Badge>
  )
}
