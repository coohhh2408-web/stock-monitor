import { cn, formatPrice, formatCurrency, getChangeColor } from '@/lib/utils'
import type { TTradeRecord } from '@/types/position'

export function TTradeTimeline({ isExpanded, records, positionId }: {
  isExpanded: boolean
  records: TTradeRecord[]
  positionId: string
}) {
  if (!isExpanded) return null
  const filtered = records.filter((r) => r.positionId === positionId)

  return (
    <div className="mt-3 pt-3 border-t border-black/[0.04] space-y-2">
      {filtered.length === 0 ? (
        <p className="text-xs text-neutral-400">暂无做T记录</p>
      ) : (
        filtered.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-neutral-50">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', r.direction === 'sell' ? 'text-[#34C759]' : 'text-[#FF3B30]')}>
                {r.direction === 'sell' ? '卖' : '买'}
              </span>
              <span className="text-neutral-400 tabular font-mono">{r.timestamp}</span>
            </div>
            <div className="flex gap-3 font-mono tabular">
              <span className="text-neutral-600">{formatPrice(r.price)} × {r.shares}</span>
              <span className={getChangeColor(r.releasedProfit)}>{r.releasedProfit !== 0 ? formatCurrency(r.releasedProfit) : '—'}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
