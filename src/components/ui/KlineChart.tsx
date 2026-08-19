import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { cn, formatPrice } from '@/lib/utils'
import type { ChartPeriod, KlineBar } from '@/types/market'
import { isCandlePeriod } from '@/services/klineApi'

interface KlineChartProps {
  bars: KlineBar[]
  period: ChartPeriod
  prevClose?: number
  loading?: boolean
  className?: string
}

const UP = '#FF3B30'
const DOWN = '#34C759'
const MA5 = '#FF9500'
const MA10 = '#AF52DE'
const MA20 = '#007AFF'

function movingAverage(bars: KlineBar[], n: number): Array<number | null> {
  return bars.map((_, i) => {
    if (i < n - 1) return null
    let sum = 0
    for (let j = 0; j < n; j++) sum += bars[i - j].close
    return sum / n
  })
}

function formatAxisTime(time: string, period: ChartPeriod): string {
  if (period === 'intraday') return time.slice(11, 16) || time.slice(-5)
  if (period === '5d') return time.slice(5, 16).replace(' ', ' ')
  return time.slice(5, 10)
}

function formatTipTime(time: string, period: ChartPeriod): string {
  if (period === 'intraday' || period === '5d') return time.slice(5, 16)
  return time
}

export function KlineChart({ bars, period, prevClose, loading, className }: KlineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(Math.max(240, el.clientWidth)))
    ro.observe(el)
    setWidth(Math.max(240, el.clientWidth))
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setHover(null)
  }, [period, bars.length])

  const candle = isCandlePeriod(period)
  const height = 196
  const volH = 42
  const pad = { top: 18, right: 44, bottom: 18, left: 6 }
  const chartH = height - volH - pad.top - pad.bottom - 6
  const innerW = Math.max(1, width - pad.left - pad.right)

  const ma5 = useMemo(() => (candle ? movingAverage(bars, 5) : []), [bars, candle])
  const ma10 = useMemo(() => (candle ? movingAverage(bars, 10) : []), [bars, candle])
  const ma20 = useMemo(() => (candle ? movingAverage(bars, 20) : []), [bars, candle])

  const stats = useMemo(() => {
    if (bars.length === 0) return null
    const highs = bars.map((b) => b.high)
    const lows = bars.map((b) => b.low)
    let min = Math.min(...lows)
    let max = Math.max(...highs)
    if (prevClose && Number.isFinite(prevClose)) {
      min = Math.min(min, prevClose)
      max = Math.max(max, prevClose)
    }
    const range = max - min || max * 0.01 || 1
    min -= range * 0.04
    max += range * 0.04
    const maxVol = Math.max(...bars.map((b) => b.volume), 1)
    return { min, max, range: max - min, maxVol }
  }, [bars, prevClose])

  const slot = bars.length > 0 ? innerW / bars.length : innerW
  const bodyW = Math.max(1.2, Math.min(7, slot * 0.68))

  const xAt = (i: number) => {
    if (bars.length <= 1) return pad.left + innerW / 2
    if (candle) return pad.left + (i + 0.5) * slot
    return pad.left + (i / (bars.length - 1)) * innerW
  }

  const yAt = (price: number) => {
    if (!stats) return pad.top + chartH / 2
    return pad.top + (1 - (price - stats.min) / stats.range) * chartH
  }

  const linePath = useMemo(() => {
    if (candle || bars.length < 2) return ''
    return bars.map((b, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(b.close)}`).join(' ')
  }, [bars, candle, stats, width])

  const areaPath = useMemo(() => {
    if (!linePath) return ''
    const lastX = xAt(bars.length - 1)
    const firstX = xAt(0)
    const baseY = pad.top + chartH
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
  }, [linePath, bars.length, chartH])

  const maPath = (series: Array<number | null>) => {
    let d = ''
    let started = false
    series.forEach((v, i) => {
      if (v === null) return
      d += `${started ? 'L' : 'M'} ${xAt(i)} ${yAt(v)} `
      started = true
    })
    return d.trim()
  }

  const last = bars[bars.length - 1]
  const active = hover !== null ? bars[hover] : last
  const activeIdx = hover ?? bars.length - 1
  const up = active ? active.close >= active.open : true
  const vsPrev = prevClose && active ? active.close - prevClose : active ? active.close - active.open : 0
  const lineUp = last && prevClose ? last.close >= prevClose : last ? last.close >= last.open : true
  const stroke = lineUp ? UP : DOWN

  const onPointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (bars.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = (x - pad.left) / innerW
    const i = Math.round(t * (bars.length - 1))
    setHover(Math.max(0, Math.min(bars.length - 1, i)))
  }

  const axisLabels = stats
    ? [stats.max, (stats.max + stats.min) / 2, stats.min].map((v) => v)
    : []

  return (
    <div ref={wrapRef} className={cn('w-full select-none', className)}>
      {active && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] tabular text-neutral-500 mb-1 min-h-[28px]">
          <span className="text-neutral-400">{formatTipTime(active.time, period)}</span>
          {candle ? (
            <>
              <span>开{formatPrice(active.open)}</span>
              <span className="text-apple-red">高{formatPrice(active.high)}</span>
              <span className="text-apple-green">低{formatPrice(active.low)}</span>
              <span className={up ? 'text-apple-red' : 'text-apple-green'}>收{formatPrice(active.close)}</span>
              {active.changePercent !== undefined && (
                <span className={active.changePercent >= 0 ? 'text-apple-red' : 'text-apple-green'}>
                  {active.changePercent >= 0 ? '+' : ''}{active.changePercent.toFixed(2)}%
                </span>
              )}
              {ma5[activeIdx] != null && <span style={{ color: MA5 }}>MA5 {ma5[activeIdx]!.toFixed(2)}</span>}
              {ma10[activeIdx] != null && <span style={{ color: MA10 }}>MA10 {ma10[activeIdx]!.toFixed(2)}</span>}
              {ma20[activeIdx] != null && <span style={{ color: MA20 }}>MA20 {ma20[activeIdx]!.toFixed(2)}</span>}
            </>
          ) : (
            <>
              <span className={vsPrev >= 0 ? 'text-apple-red' : 'text-apple-green'}>{formatPrice(active.close)}</span>
              {prevClose !== undefined && (
                <span className="text-neutral-400">昨收 {formatPrice(prevClose)}</span>
              )}
            </>
          )}
        </div>
      )}

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="touch-none"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`kfill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {loading && bars.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#A1A1AA" fontSize="12">
            加载 K 线…
          </text>
        )}

        {!loading && bars.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#A1A1AA" fontSize="12">
            暂无 K 线数据
          </text>
        )}

        {stats && axisLabels.map((v, i) => {
          const y = yAt(v)
          return (
            <g key={i}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#F2F2F7" strokeWidth="1" />
              <text x={width - 4} y={y + 3} textAnchor="end" fill="#C7C7CC" fontSize="9" fontFamily="ui-monospace, monospace">
                {v.toFixed(2)}
              </text>
            </g>
          )
        })}

        {stats && prevClose !== undefined && Number.isFinite(prevClose) && !candle && (
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={yAt(prevClose)}
            y2={yAt(prevClose)}
            stroke="#C7C7CC"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {stats && !candle && areaPath && (
          <>
            <path d={areaPath} fill={`url(#kfill-${gid})`} />
            <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}

        {stats && candle && bars.map((b, i) => {
          const x = pad.left + (i + 0.5) * slot
          const isUp = b.close >= b.open
          const color = isUp ? UP : DOWN
          const yHigh = yAt(b.high)
          const yLow = yAt(b.low)
          const yO = yAt(b.open)
          const yC = yAt(b.close)
          const top = Math.min(yO, yC)
          const h = Math.max(1, Math.abs(yC - yO))
          const volY0 = height - pad.bottom
          const volBarH = (b.volume / stats.maxVol) * volH
          return (
            <g key={b.time + i}>
              <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1" />
              <rect
                x={x - bodyW / 2}
                y={top}
                width={bodyW}
                height={h}
                fill={isUp ? color : color}
                fillOpacity={isUp ? 1 : 1}
                stroke={color}
                strokeWidth="0.6"
              />
              <rect
                x={x - bodyW / 2}
                y={volY0 - volBarH}
                width={bodyW}
                height={volBarH}
                fill={color}
                opacity="0.35"
              />
            </g>
          )
        })}

        {stats && !candle && bars.map((b, i) => {
          const x = xAt(i)
          const isUp = prevClose !== undefined ? b.close >= prevClose : b.close >= b.open
          const volY0 = height - pad.bottom
          const volBarH = (b.volume / stats.maxVol) * volH
          const barW = Math.max(0.8, slot * 0.7)
          return (
            <rect
              key={`v-${i}`}
              x={x - barW / 2}
              y={volY0 - volBarH}
              width={barW}
              height={volBarH}
              fill={isUp ? UP : DOWN}
              opacity="0.28"
            />
          )
        })}

        {stats && candle && (
          <>
            <path d={maPath(ma5)} fill="none" stroke={MA5} strokeWidth="1" />
            <path d={maPath(ma10)} fill="none" stroke={MA10} strokeWidth="1" />
            <path d={maPath(ma20)} fill="none" stroke={MA20} strokeWidth="1" />
          </>
        )}

        {stats && hover !== null && active && (
          <>
            <line
              x1={xAt(hover)}
              x2={xAt(hover)}
              y1={pad.top}
              y2={height - pad.bottom}
              stroke="#8E8E93"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
            <circle cx={xAt(hover)} cy={yAt(active.close)} r="3" fill={stroke} />
          </>
        )}

        {bars.length > 1 && [0, Math.floor(bars.length / 2), bars.length - 1].map((i) => (
          <text
            key={`t-${i}`}
            x={xAt(i)}
            y={height - 2}
            textAnchor={i === 0 ? 'start' : i === bars.length - 1 ? 'end' : 'middle'}
            fill="#C7C7CC"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
          >
            {formatAxisTime(bars[i].time, period)}
          </text>
        ))}
      </svg>
    </div>
  )
}
