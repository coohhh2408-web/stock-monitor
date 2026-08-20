import { cn, formatCurrency, formatPercent, formatYuan, getChangeColor } from '@/lib/utils'
import type { PortfolioSummary } from '@/types/position'

export function SummaryCards({
  summary,
}: {
  summary: PortfolioSummary
  isMobile?: boolean
}) {
  const prevValue = summary.totalMarketValue - summary.dailyPnL
  const dailyPct = prevValue !== 0 ? (summary.dailyPnL / prevValue) * 100 : 0
  const totalPct = summary.totalCost !== 0 ? (summary.totalPnL / summary.totalCost) * 100 : 0

  return (
    <div className="mb-6">
      <p className="text-[13px] text-neutral-500 mb-1">持仓市值</p>
      <p className="text-[34px] font-semibold tracking-tight tabular text-neutral-900 leading-none">
        {formatYuan(summary.totalMarketValue)}
      </p>
      <p className={cn('text-[15px] font-medium tabular mt-2', getChangeColor(summary.dailyPnL))}>
        当日 {formatCurrency(summary.dailyPnL)}
        <span className="text-neutral-400 font-normal mx-1.5">·</span>
        {formatPercent(dailyPct)}
      </p>

      <div className="lockup-card mt-5 overflow-hidden">
        <SummaryRow label="持仓成本" value={formatYuan(summary.totalCost)} />
        <SummaryRow
          label="累计盈亏"
          value={`${formatCurrency(summary.totalPnL)}  ${formatPercent(totalPct)}`}
          valueClass={getChangeColor(summary.totalPnL)}
        />
        <SummaryRow
          label="做T已降本"
          value={formatYuan(summary.tTradeSavedTotal)}
          valueClass="text-[#007AFF]"
          caption="已摊薄底仓"
        />
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueClass,
  caption,
}: {
  label: string
  value: string
  valueClass?: string
  caption?: string
}) {
  return (
    <div className="inset-row">
      <div className="min-w-0">
        <p className="text-[15px] text-neutral-900">{label}</p>
        {caption ? <p className="text-[12px] text-neutral-400 mt-0.5">{caption}</p> : null}
      </div>
      <p className={cn('text-[15px] font-medium tabular text-neutral-900 text-right', valueClass)}>{value}</p>
    </div>
  )
}
