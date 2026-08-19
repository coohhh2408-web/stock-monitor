import { cn } from '@/lib/utils'
import type { SparklineDataPoint } from '@/types/market'

interface SparklineChartProps {
  data: SparklineDataPoint[]
  currentPrice: number
  change: number
  className?: string
}

export function SparklineChart({ data, change, className }: SparklineChartProps) {
  if (data.length < 2) return null

  const prices = data.map((d) => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const width = 320
  const height = 100
  const padding = 2

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (d.price - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width - padding},${height} L ${padding},${height} Z`
  const strokeColor = change >= 0 ? '#FF3B30' : '#34C759'
  const fillId = change >= 0 ? 'sparkUp' : 'sparkDown'

  return (
    <div className={cn('glass p-3', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,59,48,0.12)" />
            <stop offset="100%" stopColor="rgba(255,59,48,0)" />
          </linearGradient>
          <linearGradient id="sparkDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(52,199,89,0.12)" />
            <stop offset="100%" stopColor="rgba(52,199,89,0)" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
