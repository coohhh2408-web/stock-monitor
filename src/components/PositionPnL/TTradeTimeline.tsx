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
    <div className="rounded-xl bg-white overflow-hidden mt-2">
      {filtered.length === 0 ? (
        <p className="text-[13px] text-neutral-400 px-3.5 py-3">暂无做T记录</p>
      ) : (
        filtered.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-[13px] py-2.5 px-3.5 border-b border-black/[0.06] last:border-0">
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
