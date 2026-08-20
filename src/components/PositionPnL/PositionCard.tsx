import { cn, formatListedCode, formatCurrency, formatPercent, formatYuan, getChangeColor } from '@/lib/utils'
import { lightTap } from '@/lib/nativeInit'
import type { PositionItem, TTradeStrategyStatus } from '@/types/position'
import type { QuoteItem } from '@/types/market'
import type { DragEvent, ReactNode } from 'react'

const STRATEGY: Record<TTradeStrategyStatus, string> = {
  watching: '观望',
  'insufficient-space': '空间不足',
  'trigger-zone': '可做T',
}

const MARKET_LABEL: Record<string, string> = {
  'a-share': 'A股',
  'hk-stock': '港股',
  'us-stock': '美股',
  futures: '期货',
}

interface PositionCardProps {
  position: PositionItem
  quote?: QuoteItem
  historyCount: number
  expanded: boolean
  isMobile?: boolean
  onToggle: () => void
  onEdit: () => void
  onRecordT: () => void
  onToggleHistory: () => void
  historyOpen: boolean
  onDelete: () => void
  onReorder?: (fromId: string, toId: string) => void
  historySlot?: ReactNode
}

export function PositionCard({
  position: pos,
  quote,
  historyCount,
  expanded,
  isMobile = false,
  onToggle,
  onEdit,
  onRecordT,
  onToggleHistory,
  historyOpen,
  onDelete,
  onReorder,
  historySlot,
}: PositionCardProps) {
  const market = quote?.market ?? 'a-share'
  const listed = formatListedCode(pos.code, market)
  const costBasis = pos.actualCost * pos.shares
  const pnlPct = costBasis !== 0 ? (pos.totalPnL / costBasis) * 100 : 0

  const handleDrop = (e: DragEvent) => {
    if (!onReorder) return
    e.preventDefault()
    const fromId = e.dataTransfer.getData('text/position-id')
    if (fromId && fromId !== pos.id) onReorder(fromId, pos.id)
  }

  return (
    <div
      onDragOver={(e) => {
        if (!onReorder) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={handleDrop}
    >
      <button
        type="button"
        onClick={() => {
          void lightTap()
          onToggle()
        }}
        className="w-full text-left px-4 py-3 flex items-center gap-3 bg-white active:bg-neutral-50"
      >
        {onReorder && (
          <span
            draggable
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/position-id', pos.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            className="text-neutral-300 text-[15px] cursor-grab active:cursor-grabbing select-none shrink-0"
            aria-label="拖拽排序"
          >
            ≡
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-neutral-900 leading-tight truncate">{pos.name}</p>
          <p className="text-[13px] text-neutral-400 tabular mt-0.5">
            {listed} · {pos.shares.toLocaleString('zh-CN')}股
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[17px] font-semibold tabular text-neutral-900 leading-tight">
            {formatYuan(pos.currentPrice)}
          </p>
          <p className={cn('text-[13px] font-medium tabular mt-0.5', getChangeColor(pos.totalPnL))}>
            {formatPercent(pnlPct)}
          </p>
        </div>
        <span className={cn('text-neutral-300 text-[15px] shrink-0 transition-transform', expanded && 'rotate-90')}>
          ›
        </span>
      </button>

      {expanded && (
        <div className="bg-[#F2F2F7]/80 px-4 pb-3 pt-1">
          <div className="rounded-xl bg-white overflow-hidden">
            <DetailRow label="市值" value={formatYuan(pos.marketValue)} />
            <DetailRow
              label="当日盈亏"
              value={formatCurrency(pos.dailyPnL)}
              valueClass={getChangeColor(pos.dailyPnL)}
            />
            <DetailRow
              label="累计盈亏"
              value={formatCurrency(pos.totalPnL)}
              valueClass={getChangeColor(pos.totalPnL)}
            />
            <DetailRow label="成本" value={`${formatYuan(pos.originalCost)} → ${formatYuan(pos.actualCost, 3)}`} />
            <DetailRow
              label="做T降本"
              value={`${formatYuan(pos.tTradeSaved, 3)} / 股`}
              valueClass="text-[#007AFF]"
            />
            <DetailRow label="状态" value={`${STRATEGY[pos.strategyStatus]} · ${MARKET_LABEL[market] ?? ''}`} />
          </div>

          <div className="rounded-xl bg-white overflow-hidden mt-2">
            <ActionRow label="修改持仓" onClick={onEdit} />
            <ActionRow label="记一笔做T" onClick={onRecordT} />
            <ActionRow
              label={historyOpen ? '收起做T历史' : `做T历史（${historyCount}）`}
              onClick={onToggleHistory}
            />
            <ActionRow
              label="删除持仓"
              danger
              onClick={() => {
                if (window.confirm(`确定删除「${pos.name}」持仓？做 T 记录也会一并删除。`)) onDelete()
              }}
            />
          </div>

          {historySlot}
          {!isMobile && (
            <p className="text-[11px] text-neutral-400 mt-2 px-1">桌面端可拖左侧 ≡ 调整顺序</p>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] last:border-0">
      <p className="text-[13px] text-neutral-500">{label}</p>
      <p className={cn('text-[15px] font-medium tabular text-neutral-900', valueClass)}>{value}</p>
    </div>
  )
}

function ActionRow({
  label,
  onClick,
  danger = false,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] last:border-0 active:bg-neutral-50"
    >
      <span className={cn('text-[15px]', danger ? 'text-[#FF3B30]' : 'text-[#007AFF]')}>{label}</span>
      {!danger && <span className="text-neutral-300">›</span>}
    </button>
  )
}
