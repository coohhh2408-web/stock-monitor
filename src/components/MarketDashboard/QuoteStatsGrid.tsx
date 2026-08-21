import { formatPercentRate, openVsPrevAccent } from '@/lib/quoteNumbers'
import { cn, formatAmount, formatDash, formatLargeNumber, formatListedCode, formatMarketCap, formatPrice, formatVolume } from '@/lib/utils'
import { cashConversion } from '@/services/financialsApi'
import type { FinancialsPack, QuoteItem } from '@/types/market'

type Accent = 'up' | 'down' | 'none'

function Cell({
  label,
  value,
  accent = 'none',
  edge,
}: {
  label: string
  value: string
  accent?: Accent
  edge?: 'right' | 'bottom' | 'both' | 'none'
}) {
  const color =
    accent === 'up' ? 'text-apple-red' : accent === 'down' ? 'text-apple-green' : 'text-neutral-900'
  return (
    <div
      className={cn(
        'min-w-0 px-4 py-2.5',
        (edge === 'right' || edge === 'both') && 'border-r border-black/[0.06]',
        (edge === 'bottom' || edge === 'both') && 'border-b border-black/[0.06]',
      )}
    >
      <p className="text-[13px] text-neutral-500 leading-none mb-1">{label}</p>
      <p className={cn('text-[17px] tabular tracking-tight truncate', color)}>{value}</p>
    </div>
  )
}

function peLabel(stock: QuoteItem): string {
  if (stock.pe !== undefined && stock.peTtm !== undefined && stock.pe !== stock.peTtm) return '市盈(动)'
  if (stock.market !== 'a-share') return '市盈(TTM)'
  return '市盈率'
}

function pairEdge(index: number, total: number): 'right' | 'bottom' | 'both' | 'none' {
  const isLeft = index % 2 === 0
  const lastRowStart = total % 2 === 0 ? total - 2 : total - 1
  const isLastRow = index >= lastRowStart
  if (isLeft && !isLastRow) return 'both'
  if (isLeft && isLastRow) return 'right'
  if (!isLastRow) return 'bottom'
  return 'none'
}

export function QuoteStatsGrid({ stock, financials }: { stock: QuoteItem; financials?: FinancialsPack | null }) {
  const listed = formatListedCode(stock.code, stock.market)
  const showLimits = stock.market === 'a-share' && (stock.limitUp !== undefined || stock.limitDown !== undefined)
  const openAccent = openVsPrevAccent(stock.open, stock.prevClose)

  const cells: { label: string; value: string; accent?: Accent }[] = [
    { label: '今开', value: formatPrice(stock.open), accent: openAccent },
    { label: '最高', value: formatPrice(stock.high), accent: 'up' },
    { label: '最低', value: formatPrice(stock.low), accent: 'down' },
    { label: '昨收', value: formatPrice(stock.prevClose ?? stock.open) },
    { label: '成交量', value: formatVolume(stock.volume, stock.market) },
    { label: '成交额', value: formatAmount(stock.amount, stock.market) },
    { label: '换手', value: formatPercentRate(stock.turnover) },
    { label: '振幅', value: formatPercentRate(stock.amplitude) },
    { label: '量比', value: formatDash(stock.volumeRatio) },
    { label: peLabel(stock), value: formatDash(stock.pe) },
    { label: '市净率', value: formatDash(stock.pb) },
    { label: '总市值', value: formatMarketCap(stock.marketCap, stock.market) },
  ]

  if (showLimits) {
    cells.push(
      { label: '涨停', value: formatDash(stock.limitUp), accent: 'up' },
      { label: '跌停', value: formatDash(stock.limitDown), accent: 'down' },
      { label: '流通值', value: formatMarketCap(stock.circMarketCap, stock.market) },
      { label: '市盈(TTM)', value: formatDash(stock.peTtm) },
    )
  }

  return (
    <div>
      <p className="text-[13px] text-neutral-500 px-1 mb-2">
        {listed}
        {stock.industry ? `  ·  ${stock.industry}` : ''}
      </p>
      <div className="lockup-card overflow-hidden">
        <div className="grid grid-cols-2">
          {cells.map((cell, index) => (
            <Cell
              key={cell.label}
              label={cell.label}
              value={cell.value}
              accent={cell.accent}
              edge={pairEdge(index, cells.length)}
            />
          ))}
        </div>
      </div>
      {financials && <FilingsStrip pack={financials} />}
    </div>
  )
}

function FilingsStrip({ pack }: { pack: FinancialsPack }) {
  const p = pack.latest
  const conversion = cashConversion(p)
  const cells: { label: string; value: string }[] = [
    { label: '营收', value: p.revenue === null ? '—' : formatLargeNumber(p.revenue) },
    { label: '归母净利', value: p.netProfit === null ? '—' : formatLargeNumber(p.netProfit) },
    { label: '经营现金流/净利', value: conversion === null ? '—' : `${(conversion * 100).toFixed(0)}%` },
    { label: '资产负债率', value: p.debtRatio === null ? '—' : `${p.debtRatio.toFixed(1)}%` },
  ]
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between px-1 mb-2">
        <p className="text-[13px] text-neutral-500">{p.reportName}</p>
        <p className="text-[12px] text-neutral-400">{pack.sourceLabel}</p>
      </div>
      <div className="lockup-card overflow-hidden">
        <div className="grid grid-cols-2">
          {cells.map((cell, index) => (
            <Cell
              key={cell.label}
              label={cell.label}
              value={cell.value}
              edge={pairEdge(index, cells.length)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
