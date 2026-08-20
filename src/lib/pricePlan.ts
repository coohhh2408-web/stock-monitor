import type { PlanAlertKind, PricePlan, PricePlanDraft } from '../types/pricePlan.ts'

function formatPrice(value: number): string {
  return value.toFixed(2)
}

export const PLAN_STOP_TEMPLATES = [-5, -8, -10] as const
export const PLAN_TARGET_TEMPLATES = [5, 8, 10] as const

export function roundPlanPrice(value: number): number {
  return Math.round(value * 100) / 100
}

function parsePositive(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return roundPlanPrice(n)
}

export function priceFromPercent(price: number, percent: number): number {
  return roundPlanPrice(price * (1 + percent / 100))
}

export function planAlertId(code: string, kind: PlanAlertKind): string {
  return `plan-${kind}:${code}`
}

export function isPlanAlertId(id: string): boolean {
  return id.startsWith('plan-tp:') || id.startsWith('plan-sl:')
}

export function parsePlanAlertId(id: string): { code: string; kind: PlanAlertKind } | null {
  if (id.startsWith('plan-tp:')) return { code: id.slice('plan-tp:'.length), kind: 'tp' }
  if (id.startsWith('plan-sl:')) return { code: id.slice('plan-sl:'.length), kind: 'sl' }
  return null
}

export function normalizePricePlan(
  raw: {
    code: string
    takeProfit?: number | string | null
    stopLoss?: number | string | null
    trailPercent?: number | string | null
    peakPrice?: number | string | null
    updatedAt?: string
  },
  currentPrice?: number,
): PricePlan | null {
  const takeProfit = parsePositive(raw.takeProfit)
  const stopLoss = parsePositive(raw.stopLoss)
  const trailRaw = parsePositive(raw.trailPercent)
  const trailPercent = trailRaw != null && trailRaw > 0 && trailRaw < 50 ? trailRaw : undefined
  let peakPrice = parsePositive(raw.peakPrice)
  if (trailPercent) {
    peakPrice = Math.max(peakPrice ?? 0, currentPrice ?? 0)
    peakPrice = peakPrice > 0 ? roundPlanPrice(peakPrice) : undefined
  } else {
    peakPrice = undefined
  }
  if (!takeProfit && !stopLoss && !trailPercent) return null
  return {
    code: raw.code,
    takeProfit,
    stopLoss,
    trailPercent,
    peakPrice,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function planFromDraft(
  code: string,
  draft: PricePlanDraft,
  currentPrice?: number,
  previous?: PricePlan | null,
): PricePlan | null {
  return normalizePricePlan(
    {
      code,
      takeProfit: draft.takeProfit ?? previous?.takeProfit,
      stopLoss: draft.stopLoss ?? previous?.stopLoss,
      trailPercent: draft.trailPercent ?? previous?.trailPercent,
      peakPrice: previous?.peakPrice,
      updatedAt: new Date().toISOString(),
    },
    currentPrice,
  )
}

export function effectiveStopLoss(plan: PricePlan): number | undefined {
  const trailStop =
    plan.trailPercent && plan.peakPrice
      ? roundPlanPrice(plan.peakPrice * (1 - plan.trailPercent / 100))
      : undefined
  if (plan.stopLoss != null && trailStop != null) return Math.max(plan.stopLoss, trailStop)
  return plan.stopLoss ?? trailStop
}

export interface PlanSeat {
  takeProfit?: number
  stopLoss?: number
  trailPercent?: number
  peakPrice?: number
  effectiveStop?: number
  toTpPct?: number
  toStopPct?: number
  rewardRisk?: number | null
  railPct?: number | null
  tpHit: boolean
  slHit: boolean
  stopAbovePrice: boolean
  targetBelowPrice: boolean
}

export function evaluatePricePlan(
  plan: PricePlan | null | undefined,
  price: number,
  entry?: number,
): PlanSeat {
  if (!plan || !Number.isFinite(price) || price <= 0) {
    return { tpHit: false, slHit: false, stopAbovePrice: false, targetBelowPrice: false, rewardRisk: null, railPct: null }
  }
  const takeProfit = plan.takeProfit
  const effectiveStop = effectiveStopLoss(plan)
  const tpHit = takeProfit != null && price >= takeProfit
  const slHit = effectiveStop != null && price <= effectiveStop
  const toTpPct = takeProfit != null ? ((takeProfit - price) / price) * 100 : undefined
  const toStopPct = effectiveStop != null ? ((price - effectiveStop) / price) * 100 : undefined
  const basis = entry && entry > 0 ? entry : price
  let rewardRisk: number | null = null
  if (takeProfit != null && effectiveStop != null && basis > effectiveStop) {
    const risk = basis - effectiveStop
    if (risk > 0) rewardRisk = (takeProfit - basis) / risk
  }
  let railPct: number | null = null
  if (takeProfit != null && effectiveStop != null && takeProfit > effectiveStop) {
    railPct = (price - effectiveStop) / (takeProfit - effectiveStop)
  }
  return {
    takeProfit,
    stopLoss: plan.stopLoss,
    trailPercent: plan.trailPercent,
    peakPrice: plan.peakPrice,
    effectiveStop,
    toTpPct,
    toStopPct,
    rewardRisk,
    railPct,
    tpHit,
    slHit,
    stopAbovePrice: effectiveStop != null && effectiveStop > price,
    targetBelowPrice: takeProfit != null && takeProfit < price,
  }
}

function nextPeak(plan: PricePlan, price: number): number | undefined {
  if (!plan.trailPercent || !Number.isFinite(price)) return undefined
  const peak = roundPlanPrice(Math.max(plan.peakPrice ?? 0, price))
  if (plan.peakPrice != null && peak <= plan.peakPrice + 1e-9) return undefined
  return peak
}

export function tickPlanPeaks(
  plans: Record<string, PricePlan>,
  quotes: { code: string; price: number }[],
): Record<string, PricePlan> {
  let copy: Record<string, PricePlan> | null = null
  for (const quote of quotes) {
    const plan = (copy ?? plans)[quote.code]
    if (!plan) continue
    const peak = nextPeak(plan, quote.price)
    if (peak == null) continue
    if (!copy) copy = { ...plans }
    copy[quote.code] = { ...plan, peakPrice: peak }
  }
  return copy ?? plans
}

export function loadNormalizedPlans(raw: Record<string, PricePlan> | null | undefined): Record<string, PricePlan> {
  const out: Record<string, PricePlan> = {}
  if (!raw) return out
  for (const [code, plan] of Object.entries(raw)) {
    const normalized = normalizePricePlan({ ...plan, code: plan?.code || code })
    if (normalized) out[code] = normalized
  }
  return out
}

export function planArmIds(previous: PricePlan | null | undefined, next: PricePlan | null): string[] {
  if (!next) {
    if (!previous) return []
    return [planAlertId(previous.code, 'tp'), planAlertId(previous.code, 'sl')]
  }
  const ids: string[] = []
  if (previous?.takeProfit !== next.takeProfit) ids.push(planAlertId(next.code, 'tp'))
  if (
    previous?.stopLoss !== next.stopLoss
    || previous?.trailPercent !== next.trailPercent
  ) {
    ids.push(planAlertId(next.code, 'sl'))
  }
  return ids
}

export function collectPlanTriggers(
  plans: Record<string, PricePlan>,
  quotes: { code: string; name: string; price: number }[],
): { id: string; kind: PlanAlertKind; quote: { code: string; name: string; price: number }; plan: PricePlan }[] {
  const hits: { id: string; kind: PlanAlertKind; quote: { code: string; name: string; price: number }; plan: PricePlan }[] = []
  for (const quote of quotes) {
    const plan = plans[quote.code]
    if (!plan) continue
    const seat = evaluatePricePlan(plan, quote.price)
    if (seat.tpHit) hits.push({ id: planAlertId(quote.code, 'tp'), kind: 'tp', quote, plan })
    if (seat.slHit) hits.push({ id: planAlertId(quote.code, 'sl'), kind: 'sl', quote, plan })
  }
  return hits
}

export function planTriggerTitle(kind: PlanAlertKind, name: string): string {
  return kind === 'tp' ? `${name} 止盈到价` : `${name} 止损到价`
}

export function planTriggerMessage(
  kind: PlanAlertKind,
  quote: { name: string; price: number },
  plan: PricePlan,
): string {
  if (kind === 'tp' && plan.takeProfit != null) {
    return `${quote.name} 现价 ${formatPrice(quote.price)}，已到你设的止盈 ${formatPrice(plan.takeProfit)}。这是计划价提醒，不是下单。`
  }
  const stop = effectiveStopLoss(plan)
  const trail =
    plan.trailPercent && plan.peakPrice
      ? `（含从高点 ${formatPrice(plan.peakPrice)} 回撤 ${plan.trailPercent}%）`
      : ''
  return `${quote.name} 现价 ${formatPrice(quote.price)}，已到你设的止损 ${stop != null ? formatPrice(stop) : '—'}${trail}。这是计划价提醒，不是下单。`
}

export function formatRewardRisk(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null
  if (value <= 0) return '盈亏比不足 0'
  return `${value.toFixed(1)}R`
}
