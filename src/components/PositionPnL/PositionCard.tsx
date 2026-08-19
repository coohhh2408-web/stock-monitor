import { cn, formatListedCode, formatCurrency, formatPercent, formatYuan } from '@/lib/utils'
import type { PositionItem, TTradeStrategyStatus } from '@/types/position'
import type { QuoteItem } from '@/types/market'
import type { DragEvent, ReactNode } from 'react'

const STRATEGY: Record<TTradeStrategyStatus, string> = {
  watching: '震荡 持仓观望',
  'insufficient-space': '空间不足 暂缓做T',
  'trigger-zone': '可做T 触发区',
}

const MARKET_LABEL: Record<string, string> = {
  'a-share': 'A股',
  'hk-stock': '港股',
  'us-stock': '美股',
  futures: '国际期货',
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M8.2 1.8l2 2L3.8 10.2H1.8v-2L8.2 1.8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6.8 1.5L2.5 6.8h3.2L5.2 10.5l4.3-5.3H6.3L6.8 1.5z" fill="currentColor" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3.8V6l1.6 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ActionButton({
  children,
  onClick,
  danger = false,
  className,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
        danger
          ? 'text-[#FF3B30] bg-red-50 hover:bg-red-100'
          : 'text-neutral-600 bg-[#F2F3F5] hover:bg-neutral-200',
        className,
      )}
    >
      {children}
    </button>
  )
}

interface PositionCardProps {
  position: PositionItem
  quote?: QuoteItem
  historyCount: number
  isMobile?: boolean
  onEdit: () => void
  onRecordT: () => void
  onToggleHistory: () => void
  onDelete: () => void
  onReorder?: (fromId: string, toId: string) => void
  historySlot?: ReactNode
}

export function PositionCard({
  position: pos,
  quote,
  historyCount,
  isMobile = false,
  onEdit,
  onRecordT,
  onToggleHistory,
  onDelete,
  onReorder,
  historySlot,
}: PositionCardProps) {
  const market = quote?.market ?? 'a-share'
  const listed = formatListedCode(pos.code, market)
  const costBasis = pos.actualCost * pos.shares
  const pnlPct = costBasis !== 0 ? (pos.totalPnL / costBasis) * 100 : 0
  const isUp = pos.totalPnL >= 0

  const handleDrop = (e: DragEvent) => {
    if (!onReorder) return
    e.preventDefault()
    const fromId = e.dataTransfer.getData('text/position-id')
    if (fromId && fromId !== pos.id) onReorder(fromId, pos.id)
  }

  const actions = (
    <div className={cn(isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap justify-end gap-1.5')}>
      <ActionButton onClick={onEdit} className={isMobile ? 'w-full' : undefined}>
        <PencilIcon /> 修改
      </ActionButton>
      <ActionButton onClick={onRecordT} className={isMobile ? 'w-full' : undefined}>
        <BoltIcon /> 记做T
      </ActionButton>
      <ActionButton onClick={onToggleHistory} className={isMobile ? 'w-full' : undefined}>
        <ClockIcon /> 历史({historyCount})
      </ActionButton>
      <ActionButton
        danger
        className={isMobile ? 'w-full' : undefined}
        onClick={() => {
          if (window.confirm(`确定删除「${pos.name}」持仓？做 T 记录也会一并删除。`)) onDelete()
        }}
      >
        <CloseIcon /> 删除
      </ActionButton>
    </div>
  )

  const pnlBadge = isMobile ? (
    <div className="text-right shrink-0">
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-[12px] font-semibold text-white tabular leading-none',
          isUp ? 'bg-[#FF3B30]' : 'bg-[#34C759]',
        )}
      >
        {formatPercent(pnlPct)}
      </span>
      <p className={cn('text-[12px] font-semibold tabular mt-1', isUp ? 'text-[#FF3B30]' : 'text-[#34C759]')}>
        {formatCurrency(pos.totalPnL)}
      </p>
    </div>
  ) : (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold text-white tabular leading-none whitespace-nowrap',
        isUp ? 'bg-[#FF3B30]' : 'bg-[#34C759]',
      )}
    >
      {formatCurrency(pos.totalPnL)} ({formatPercent(pnlPct)})
    </span>
  )

  const strategyBadge = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F3F5] px-2.5 py-1 text-[11px] text-neutral-500 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
      {STRATEGY[pos.strategyStatus]}
    </span>
  )

  return (
    <article
      onDragOver={(e) => {
        if (!onReorder) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={handleDrop}
      className="position-card"
    >
      <div className={cn('flex gap-3', isMobile ? 'flex-col' : 'items-start')}>
        {onReorder && (
          <span
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/position-id', pos.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            className="text-neutral-300 text-[16px] leading-5 mt-0.5 cursor-grab active:cursor-grabbing select-none shrink-0"
            aria-label="拖拽排序"
          >
            ≡
          </span>
        )}

        {isMobile ? (
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold text-neutral-900 leading-tight">{pos.name}</h3>
                <p className="text-[12px] text-neutral-400 font-mono tabular mt-0.5">
                  {listed} · {MARKET_LABEL[market]}
                </p>
              </div>
              {pnlBadge}
            </div>
            <p className="text-[22px] font-bold font-mono tabular text-neutral-900 mt-3 leading-none">
              {formatYuan(pos.currentPrice)}
            </p>
            <p className="text-[13px] text-neutral-500 mt-2">
              {pos.shares.toLocaleString('zh-CN')}股 · 市值 {formatYuan(pos.marketValue)}
            </p>
            <p className="text-[12px] text-neutral-400 mt-1.5">
              成本 {formatYuan(pos.originalCost)} → {formatYuan(pos.actualCost, 3)}
            </p>
            <p className="text-[12px] text-[#34C759] mt-1 font-medium tabular">
              做T已拉低 {formatYuan(pos.tTradeSaved, 3)} / 股
            </p>
            <div className="mt-2">{strategyBadge}</div>
            <div className="mt-3">{actions}</div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 grid grid-cols-[1.15fr_1.25fr_auto] gap-4 items-start">
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-neutral-900 leading-tight">{pos.name}</h3>
              <p className="text-[12px] text-neutral-400 font-mono tabular mt-1">
                {listed} {MARKET_LABEL[market]}
              </p>
              <p className="text-[13px] text-neutral-500 mt-2">
                持仓 {pos.shares.toLocaleString('zh-CN')} 股，市值 {formatYuan(pos.marketValue)}
              </p>
            </div>

            <div>
              <p className="text-[22px] font-bold font-mono tabular text-neutral-900 leading-none">
                {formatYuan(pos.currentPrice)}
              </p>
              <p className="text-[12px] text-neutral-400 mt-2">
                原始成本 {formatYuan(pos.originalCost)} {'->'} 实际 {formatYuan(pos.actualCost, 3)}
              </p>
              <p className="text-[12px] text-[#34C759] mt-1 font-medium tabular">
                做T已拉低 {formatYuan(pos.tTradeSaved, 3)} / 股
              </p>
              <div className="mt-2">{strategyBadge}</div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              {pnlBadge}
              {actions}
            </div>
          </div>
        )}
      </div>
      {historySlot}
    </article>
  )
}
