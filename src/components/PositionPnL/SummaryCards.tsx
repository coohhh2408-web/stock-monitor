import { cn, formatCurrency, formatPercent, formatYuan, getChangeColor, getChangeBgColor } from '@/lib/utils'
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
    <div className={cn('lockup-card mb-6', isMobile ? 'p-5' : 'px-8 py-6')}>
      <div className={isMobile ? 'flex flex-col gap-5' : 'grid grid-cols-4'}>
        <section className={isMobile ? '' : 'pr-8'}>
          <p className="text-[13px] text-neutral-400">持仓总市值 (CNY)</p>
          <p className="text-[32px] font-bold tracking-tight tabular text-neutral-900 leading-none mt-2">
            {formatYuan(summary.totalMarketValue)}
          </p>
          <p
            className={cn(
              'inline-flex mt-3 rounded-lg px-2.5 py-[5px] text-[13px] font-medium tabular',
              getChangeBgColor(summary.dailyPnL),
            )}
          >
            当日 {formatCurrency(summary.dailyPnL)} ({formatPercent(dailyPct)})
          </p>
        </section>

        <Metric
          label="持仓总成本"
          value={formatYuan(summary.totalCost)}
          divided={!isMobile}
        />
        <Metric
          label="累计总盈亏"
          value={formatCurrency(summary.totalPnL)}
          valueClass={getChangeColor(summary.totalPnL)}
          hint={formatPercent(totalPct)}
          hintClass={getChangeColor(summary.totalPnL)}
          divided={!isMobile}
        />
        <Metric
          label="做T累计降低成本"
          value={formatYuan(summary.tTradeSavedTotal)}
          valueClass="text-[#007AFF]"
          hint="已摊薄底仓"
          divided={!isMobile}
        />
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  valueClass,
  hint,
  hintClass,
  divided,
}: {
  label: string
  value: string
  valueClass?: string
  hint?: string
  hintClass?: string
  divided?: boolean
}) {
  return (
    <section className={cn(divided && 'border-l border-black/[0.06] pl-8')}>
      <p className="text-[13px] text-neutral-400">{label}</p>
      <p className={cn('text-[22px] font-bold tracking-tight tabular text-neutral-900 leading-none mt-2', valueClass)}>
        {value}
      </p>
      {hint ? (
        <p className={cn('text-[13px] mt-2 tabular', hintClass ?? 'text-neutral-400')}>{hint}</p>
      ) : null}
    </section>
  )
}
