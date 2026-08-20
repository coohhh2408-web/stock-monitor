import { useEffect, useMemo, useState } from 'react'
import { cn, formatPercent, formatPrice, formatQuotePrice } from '@/lib/utils'
import {
  PLAN_STOP_TEMPLATES,
  PLAN_TARGET_TEMPLATES,
  evaluatePricePlan,
  formatRewardRisk,
  priceFromPercent,
} from '@/lib/pricePlan'
import { useAppStore } from '@/store/AppStore'
import type { QuoteItem } from '@/types/market'
import type { PricePlan, PricePlanDraft } from '@/types/pricePlan'

interface PricePlanStripProps {
  quote: QuoteItem
  variant?: 'card' | 'list' | 'panel'
}

export function PricePlanStrip({ quote, variant = 'card' }: PricePlanStripProps) {
  const { pricePlans, positions, setPricePlan, clearPricePlan } = useAppStore()
  const plan = pricePlans[quote.code]
  const entry = positions.find((p) => p.code === quote.code)?.actualCost
  const seat = useMemo(() => evaluatePricePlan(plan, quote.price, entry), [plan, quote.price, entry])
  const [open, setOpen] = useState(variant === 'panel')

  useEffect(() => {
    if (variant === 'panel') setOpen(true)
  }, [variant, quote.code])

  return (
    <div
      data-no-drag
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={(e) => e.stopPropagation()}
      className={cn(variant === 'list' ? 'mt-2' : 'mt-3')}
    >
      {variant === 'panel' ? (
        <div className="mb-2">
          <p className="text-[13px] font-semibold text-neutral-800">止盈 / 止损</p>
          <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
            借鉴看盘软件的风险回报标尺：两个计划价画在现价两边，到价按提醒通知。这是你自己写的计划，不是下单，也不是荐股。
          </p>
        </div>
      ) : plan ? (
        <PlanSummary quote={quote} plan={plan} compact={variant === 'list'} onEdit={() => setOpen((v) => !v)} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'text-neutral-400 hover:text-neutral-600 transition-colors',
            variant === 'list' ? 'text-[11px]' : 'text-[11px] font-medium',
          )}
        >
          {open ? '收起计划' : '止盈 / 止损'}
        </button>
      )}

      {plan && (variant === 'panel' || (variant === 'card' && !open)) && (
        <>
          {variant === 'panel' && (
            <PlanSummary quote={quote} plan={plan} compact={false} onEdit={() => setOpen(true)} />
          )}
          <PlanRail seat={seat} />
        </>
      )}

      {open && (
        <PlanEditor
          quote={quote}
          plan={plan}
          compact={variant !== 'panel'}
          onSave={setPricePlan}
          onClear={clearPricePlan}
          onClose={variant === 'panel' ? undefined : () => setOpen(false)}
        />
      )}
    </div>
  )
}

function PlanSummary({
  quote,
  plan,
  compact,
  onEdit,
}: {
  quote: QuoteItem
  plan: PricePlan
  compact: boolean
  onEdit: () => void
}) {
  const { positions } = useAppStore()
  const entry = positions.find((p) => p.code === quote.code)?.actualCost
  const seat = evaluatePricePlan(plan, quote.price, entry)
  const rr = formatRewardRisk(seat.rewardRisk)
  const stop = seat.effectiveStop

  if (compact) {
    return (
      <button type="button" onClick={onEdit} className="flex flex-wrap items-center gap-1.5 text-left w-full">
        {stop != null && (
          <Chip tone={seat.slHit ? 'danger' : 'muted'}>
            {seat.slHit ? '已到止损' : `止损 ${formatPrice(stop)}`}
          </Chip>
        )}
        {seat.takeProfit != null && (
          <Chip tone={seat.tpHit ? 'hot' : 'muted'}>
            {seat.tpHit ? '已到止盈' : `止盈 ${formatPrice(seat.takeProfit)}`}
          </Chip>
        )}
        {rr && <Chip tone="accent">{rr}</Chip>}
      </button>
    )
  }

  return (
    <button type="button" onClick={onEdit} className="w-full text-left">
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="text-[10px] text-neutral-400">{plan.trailPercent ? '跟踪止损' : '止损'}</p>
          <p className={cn('text-[12px] font-mono tabular font-semibold mt-0.5', seat.slHit ? 'text-apple-green' : 'text-neutral-800')}>
            {stop != null ? formatQuotePrice(stop, quote.market) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-400">现价</p>
          <p className="text-[12px] font-mono tabular font-semibold mt-0.5 text-neutral-900">
            {formatQuotePrice(quote.price, quote.market)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-400">止盈</p>
          <p className={cn('text-[12px] font-mono tabular font-semibold mt-0.5', seat.tpHit ? 'text-apple-red' : 'text-neutral-800')}>
            {seat.takeProfit != null ? formatQuotePrice(seat.takeProfit, quote.market) : '—'}
          </p>
        </div>
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] tabular text-neutral-400">
        <span className={seat.slHit ? 'text-apple-green font-medium' : undefined}>
          {seat.slHit
            ? '已到止损'
            : seat.toStopPct != null
              ? `距止损 ${seat.toStopPct.toFixed(2)}%`
              : ''}
        </span>
        <span className="text-neutral-500 font-medium">{rr ?? ''}</span>
        <span className={seat.tpHit ? 'text-apple-red font-medium' : undefined}>
          {seat.tpHit ? '已到止盈' : seat.toTpPct != null ? `距止盈 ${formatPercent(seat.toTpPct)}` : ''}
        </span>
      </div>
    </button>
  )
}

function PlanRail({
  seat,
}: {
  seat: ReturnType<typeof evaluatePricePlan>
}) {
  if (seat.railPct == null) return null
  const pct = Math.max(0, Math.min(1, seat.railPct)) * 100
  return (
    <div className="mt-2 px-0.5" aria-hidden>
      <div className="relative h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#34C759]/35 via-neutral-200 to-[#FF3B30]/40" />
      </div>
      <div className="relative h-0">
        <span
          className="absolute -top-2.5 w-2.5 h-2.5 rounded-full bg-neutral-900 border-2 border-white shadow-sm"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  )
}

function Chip({ children, tone }: { children: string; tone: 'muted' | 'danger' | 'hot' | 'accent' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium tabular',
        tone === 'muted' && 'bg-neutral-100 text-neutral-500',
        tone === 'danger' && 'bg-[#34C759]/10 text-apple-green',
        tone === 'hot' && 'bg-[#FF3B30]/10 text-apple-red',
        tone === 'accent' && 'bg-[#FF9500]/10 text-[#C77B00]',
      )}
    >
      {children}
    </span>
  )
}

function PlanEditor({
  quote,
  plan,
  compact,
  onSave,
  onClear,
  onClose,
}: {
  quote: QuoteItem
  plan?: PricePlan
  compact: boolean
  onSave: (code: string, draft: PricePlanDraft) => Promise<void>
  onClear: (code: string) => void
  onClose?: () => void
}) {
  const [stop, setStop] = useState(plan?.stopLoss != null ? String(plan.stopLoss) : '')
  const [target, setTarget] = useState(plan?.takeProfit != null ? String(plan.takeProfit) : '')
  const [trail, setTrail] = useState(plan?.trailPercent != null ? String(plan.trailPercent) : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStop(plan?.stopLoss != null ? String(plan.stopLoss) : '')
    setTarget(plan?.takeProfit != null ? String(plan.takeProfit) : '')
    setTrail(plan?.trailPercent != null ? String(plan.trailPercent) : '')
  }, [plan?.stopLoss, plan?.takeProfit, plan?.trailPercent, quote.code])

  const preview = useMemo(
    () =>
      evaluatePricePlan(
        {
          code: quote.code,
          stopLoss: stop ? Number(stop) : undefined,
          takeProfit: target ? Number(target) : undefined,
          trailPercent: trail ? Number(trail) : undefined,
          peakPrice: plan?.peakPrice ?? quote.price,
          updatedAt: plan?.updatedAt ?? '',
        },
        quote.price,
      ),
    [quote.code, quote.price, stop, target, trail, plan?.peakPrice, plan?.updatedAt],
  )

  const draft: PricePlanDraft = {
    stopLoss: stop,
    takeProfit: target,
    trailPercent: trail,
  }

  const save = async (next: PricePlanDraft = draft) => {
    setSaving(true)
    try {
      await onSave(quote.code, next)
      onClose?.()
    } finally {
      setSaving(false)
    }
  }

  const applyStopPct = (percent: number) => {
    const value = String(priceFromPercent(quote.price, percent))
    setStop(value)
    void save({ ...draft, stopLoss: value })
  }

  const applyTargetPct = (percent: number) => {
    const value = String(priceFromPercent(quote.price, percent))
    setTarget(value)
    void save({ ...draft, takeProfit: value })
  }

  return (
    <div className={cn('rounded-xl bg-neutral-50 border border-black/[0.04]', compact ? 'mt-2 p-2.5' : 'p-3')}>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] text-neutral-400">止损价</span>
          <input
            type="number"
            inputMode="decimal"
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            placeholder={formatPrice(quote.price)}
            className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white text-[13px] font-mono tabular focus:outline-none border border-black/[0.04]"
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-neutral-400">止盈价</span>
          <input
            type="number"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={formatPrice(quote.price)}
            className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white text-[13px] font-mono tabular focus:outline-none border border-black/[0.04]"
          />
        </label>
      </div>

      <p className="text-[10px] text-neutral-400 mt-2">用现价估算，不是建议</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {PLAN_STOP_TEMPLATES.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => applyStopPct(pct)}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-apple-green border border-black/[0.04] hover:bg-neutral-100"
          >
            {pct}%
          </button>
        ))}
        <span className="w-px h-4 bg-neutral-200 self-center mx-0.5" />
        {PLAN_TARGET_TEMPLATES.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => applyTargetPct(pct)}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-apple-red border border-black/[0.04] hover:bg-neutral-100"
          >
            +{pct}%
          </button>
        ))}
      </div>

      <label className="block mt-2">
        <span className="text-[10px] text-neutral-400">回撤跟踪 %（可选，从阶段高点往下算）</span>
        <input
          type="number"
          inputMode="decimal"
          value={trail}
          onChange={(e) => setTrail(e.target.value)}
          placeholder="如 8"
          className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white text-[13px] font-mono tabular focus:outline-none border border-black/[0.04]"
        />
      </label>

      {preview.effectiveStop != null && Number(trail) > 0 && (
        <p className="text-[10px] text-neutral-500 mt-1.5 tabular">
          当前跟踪止损 {formatPrice(preview.effectiveStop)}
          {preview.peakPrice != null ? ` · 高点 ${formatPrice(preview.peakPrice)}` : ''}
        </p>
      )}
      {preview.rewardRisk != null && (
        <p className="text-[10px] text-neutral-500 mt-1 tabular">
          盈亏比 {formatRewardRisk(preview.rewardRisk)}
          {preview.stopAbovePrice ? ' · 止损高于现价，保存后会立即提醒' : ''}
          {preview.targetBelowPrice ? ' · 止盈低于现价，保存后会立即提醒' : ''}
        </p>
      )}
      {(preview.stopAbovePrice || preview.targetBelowPrice) && preview.rewardRisk == null && (
        <p className="text-[10px] text-amber-600 mt-1">
          {preview.stopAbovePrice ? '止损高于现价，保存后会立即提醒。' : '止盈低于现价，保存后会立即提醒。'}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="text-[11px] bg-neutral-900 text-white px-3 py-1.5 rounded-full font-medium disabled:opacity-50"
        >
          保存计划
        </button>
        {plan && (
          <button
            type="button"
            onClick={() => {
              onClear(quote.code)
              onClose?.()
            }}
            className="text-[11px] text-neutral-400 hover:text-neutral-600 px-2 py-1.5"
          >
            清除
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto text-[11px] text-neutral-400">
            收起
          </button>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
        到价走来电式提醒；不会替你向券商下单。
      </p>
    </div>
  )
}
