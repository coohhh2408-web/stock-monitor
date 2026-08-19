import { cn } from '@/lib/utils'
import type { SparklineDataPoint } from '@/types/market'

interface MiniSparklineProps {
  data: SparklineDataPoint[]
  change: number
  className?: string
  width?: number
  height?: number
  gradientId?: string
}

export function MiniSparkline({
  data,
  change,
  className,
  width = 80,
  height = 36,
  gradientId = 'default',
}: MiniSparklineProps) {
  if (data.length < 2) return <div className={cn('w-20 h-9', className)} />

  const prices = data.map((d) => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const pad = 1
  const isUp = change >= 0
  const safeId = gradientId.replace(/[^a-zA-Z0-9_-]/g, '')
  const fillId = isUp ? `miniUp-${safeId}` : `miniDown-${safeId}`

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (d.price - min) / range) * (height - pad * 2)
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width - pad},${height} L ${pad},${height} Z`
  const stroke = isUp ? '#FF3B30' : '#34C759'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('shrink-0', className)}
      style={className?.includes('w-full') ? { height } : { width, height }}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isUp ? 'rgba(255,59,48,0.22)' : 'rgba(52,199,89,0.22)'} />
          <stop offset="100%" stopColor={isUp ? 'rgba(255,59,48,0)' : 'rgba(52,199,89,0)'} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
