import { cn, formatCurrency, formatPercent, formatYuan, getChangeColor } from '@/lib/utils'
import type { PortfolioSummary } from '@/types/position'

export function SummaryCards({
  summary,
  isMobile = false,
}: {
  summary: PortfolioSummary
  isMobile?: boolean
}) {
  const prevValue = summary.totalMarketValue - summary.dailyPnL
  const dailyPct = prevValue !== 0 ? (summary.dailyPnL / prevValue) * 100 : 0
  const totalPct = summary.totalCost !== 0 ? (summary.totalPnL / summary.totalCost) * 100 : 0

  return (
    <div className={cn('position-summary-card mb-4', isMobile && '!p-4')}>
      <div className={cn(isMobile ? 'grid grid-cols-2 gap-x-4 gap-y-3' : 'grid grid-cols-4 gap-6 items-start')}>
        <div>
          <p className="text-[12px] text-neutral-400 mb-1">持仓总市值</p>
          <p className={cn('font-bold tracking-tight font-mono tabular text-neutral-900 leading-none', isMobile ? 'text-[20px]' : 'text-[28px]')}>
            {formatYuan(summary.totalMarketValue)}
          </p>
          <span
            className={cn(
              'inline-flex items-center mt-2 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular leading-none',
              summary.dailyPnL > 0
                ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                : summary.dailyPnL < 0
                  ? 'bg-[#34C759]/10 text-[#34C759]'
                  : 'bg-neutral-100 text-neutral-500',
            )}
          >
            当日 {formatCurrency(summary.dailyPnL)} ({formatPercent(dailyPct)})
          </span>
        </div>

        <div>
          <p className="text-[12px] text-neutral-400 mb-1">持仓总成本</p>
          <p className={cn('font-semibold tracking-tight font-mono tabular text-neutral-900 leading-tight', isMobile ? 'text-[18px]' : 'text-[22px]')}>
            {formatYuan(summary.totalCost)}
          </p>
        </div>

        <div>
          <p className="text-[12px] text-neutral-400 mb-1">累计总盈亏</p>
          <p className={cn('font-semibold tracking-tight font-mono tabular leading-tight', isMobile ? 'text-[18px]' : 'text-[22px]', getChangeColor(summary.totalPnL))}>
            {formatCurrency(summary.totalPnL)}
          </p>
          <p className={cn('text-[12px] font-medium tabular mt-1', getChangeColor(summary.totalPnL))}>
            {formatPercent(totalPct)}
          </p>
        </div>

        <div>
          <p className="text-[12px] text-neutral-400 mb-1">做T已降本</p>
          <p className={cn('font-semibold tracking-tight font-mono tabular text-[#007AFF] leading-tight', isMobile ? 'text-[18px]' : 'text-[22px]')}>
            {formatYuan(summary.tTradeSavedTotal)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">已摊薄底仓</p>
        </div>
      </div>
    </div>
  )
}
