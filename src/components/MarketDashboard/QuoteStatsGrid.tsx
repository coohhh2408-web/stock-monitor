import { formatAmount, formatDash, formatListedCode, formatMarketCap, formatPrice, formatVolume } from '@/lib/utils'
import type { QuoteItem } from '@/types/market'

function Cell({ label, value, accent }: { label: string; value: string; accent?: 'up' | 'down' | 'none' }) {
  const color =
    accent === 'up' ? 'text-apple-red' : accent === 'down' ? 'text-apple-green' : 'text-neutral-800'
  return (
    <div className="min-w-0 py-1.5">
      <p className="text-[10px] text-neutral-400 leading-none mb-1">{label}</p>
      <p className={`text-[12px] font-medium tabular truncate ${color}`}>{value}</p>
    </div>
  )
}

function peLabel(stock: QuoteItem): string {
  if (stock.pe !== undefined && stock.peTtm !== undefined && stock.pe !== stock.peTtm) return '市盈(动)'
  if (stock.market !== 'a-share') return '市盈(TTM)'
  return '市盈率'
}

export function QuoteStatsGrid({ stock }: { stock: QuoteItem }) {
  const listed = formatListedCode(stock.code, stock.market)
  const showLimits = stock.market === 'a-share' && (stock.limitUp !== undefined || stock.limitDown !== undefined)
  const vsOpen = stock.price - stock.open

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] text-neutral-400 tabular">
          {listed}
          {stock.industry ? ` · ${stock.industry}` : ''}
        </p>
        <p className="text-[10px] text-neutral-300">盘口数据来自东方财富</p>
      </div>
      <div className="grid grid-cols-4 gap-x-2 border-t border-neutral-100">
        <Cell label="今开" value={formatPrice(stock.open)} accent={vsOpen >= 0 ? 'up' : 'down'} />
        <Cell label="最高" value={formatPrice(stock.high)} accent="up" />
        <Cell label="最低" value={formatPrice(stock.low)} accent="down" />
        <Cell label="昨收" value={formatPrice(stock.prevClose ?? stock.open)} />
        <Cell label="成交量" value={formatVolume(stock.volume, stock.market)} />
        <Cell label="成交额" value={formatAmount(stock.amount, stock.market)} />
        <Cell label="换手" value={stock.turnover !== undefined ? `${stock.turnover.toFixed(2)}%` : '—'} />
        <Cell label="振幅" value={stock.amplitude !== undefined ? `${stock.amplitude.toFixed(2)}%` : '—'} />
        <Cell label="量比" value={formatDash(stock.volumeRatio)} />
        <Cell label={peLabel(stock)} value={formatDash(stock.pe)} />
        <Cell label="市净率" value={formatDash(stock.pb)} />
        <Cell label="总市值" value={formatMarketCap(stock.marketCap, stock.market)} />
        {showLimits && (
          <>
            <Cell label="涨停" value={formatDash(stock.limitUp)} accent="up" />
            <Cell label="跌停" value={formatDash(stock.limitDown)} accent="down" />
            <Cell label="流通值" value={formatMarketCap(stock.circMarketCap, stock.market)} />
            <Cell label="市盈(TTM)" value={formatDash(stock.peTtm)} />
          </>
        )}
      </div>
    </div>
  )
}
