import { formatQuotePrice } from '@/lib/utils'
import { priceSeat } from '@/lib/sageBand'
import type { BusinessKind, ValueStance } from '@/services/buffettMunger'
import type { QuoteItem } from '@/types/market'

export type SageAuthorId = 'buffett' | 'munger' | 'duan'
export type SageAction = 'buy' | 'wait' | 'pass'

export interface SagePlan {
  action: SageAction
  actionLabel: string
  nowPrice: number
  buyFrom: number | null
  buyTo: number | null
  addAt: number | null
  trimAt: number | null
  reviewAt: number | null
  firstLotPct: string
  maxLotPct: string
  peNow: number | null
  peTarget: number | null
  nextStep: string
  basis: string
}

interface PeBand {
  add: number
  buy: number
  stretch: number
}

export const PE_BAND: Record<Exclude<BusinessKind, 'futures'>, PeBand> = {
  'consumer-franchise': { add: 18, buy: 22, stretch: 32 },
  bank: { add: 6, buy: 8, stretch: 12 },
  insurance: { add: 7, buy: 10, stretch: 14 },
  platform: { add: 14, buy: 18, stretch: 28 },
  semiconductor: { add: 18, buy: 25, stretch: 40 },
  'ev-battery': { add: 12, buy: 16, stretch: 25 },
  commodity: { add: 7, buy: 10, stretch: 15 },
  auto: { add: 8, buy: 12, stretch: 20 },
  solar: { add: 8, buy: 12, stretch: 18 },
  pharma: { add: 15, buy: 20, stretch: 30 },
  telecom: { add: 9, buy: 12, stretch: 16 },
  utility: { add: 11, buy: 14, stretch: 18 },
  realty: { add: 6, buy: 8, stretch: 12 },
  manufacturing: { add: 10, buy: 14, stretch: 20 },
  unknown: { add: 12, buy: 15, stretch: 25 },
}

const AUTHOR = {
  buffett: {
    peBias: 1,
    waitPad: 0,
    firstBuy: '10%–15%',
    firstWait: '8%–12%',
    firstCautious: '5%',
    maxBuy: '25%–30%',
    maxWait: '20%',
    maxCautious: '10%',
    trim: null as number | null,
    addGap: 0.08,
    review: 0.22,
  },
  munger: {
    peBias: 0.92,
    waitPad: 0.04,
    firstBuy: '8%–12%',
    firstWait: '5%–8%',
    firstCautious: '0–5% 观察仓',
    maxBuy: '18%–20%',
    maxWait: '12%',
    maxCautious: '5%',
    trim: 0.22,
    addGap: 0.12,
    review: 0.2,
  },
  duan: {
    peBias: 0.82,
    waitPad: 0.08,
    firstBuy: '5%–8%',
    firstWait: '5%',
    firstCautious: '0%',
    maxBuy: '15%',
    maxWait: '10%',
    maxCautious: '0%',
    trim: 0.3,
    addGap: 0.16,
    review: 0.25,
  },
} as const

export function buildSagePlan(
  stock: QuoteItem,
  kind: BusinessKind,
  stance: ValueStance,
  author: SageAuthorId,
): SagePlan {
  const now = stock.price
  const pe = getStockPe(stock)
  const style = AUTHOR[author]
  const money = (n: number) => formatQuotePrice(roundMoney(n, now), stock.market)

  if (kind === 'futures' || stance === 'skeptical') {
    const reviewAt = roundMoney(now * (1 - style.review), now)
    return {
      action: 'pass',
      actionLabel: '不碰',
      nowPrice: now,
      buyFrom: null,
      buyTo: null,
      addAt: null,
      trimAt: null,
      reviewAt,
      firstLotPct: '0%',
      maxLotPct: '0%',
      peNow: pe,
      peTarget: null,
      basis: '能力圈或生意质量未过关',
      nextStep: `${authorLead(author)}当前 ${money(now)}。建议仓位 0%，不要做「先买一点再说」。若价格跌到 ${money(reviewAt)}（${vsNow(reviewAt, now)}），也只是重审逻辑，不是自动抄底。`,
    }
  }

  const band = PE_BAND[kind]
  const targetPe = band ? round1(band.buy * style.peBias) : null
  const addPe = band ? round1(band.add * style.peBias) : null
  let buyTo: number
  let buyFrom: number
  let basis: string

  if (pe !== null && pe > 0 && targetPe && addPe) {
    buyTo = roundMoney(now * (targetPe / pe), now)
    buyFrom = roundMoney(now * (addPe / pe), now)
    basis = `按当前盈利，目标约 ${targetPe.toFixed(0)} 倍市盈率（现价约 ${pe.toFixed(0)} 倍）`
  } else {
    const wait = stance === 'constructive' ? 0.08 + style.waitPad : 0.16 + style.waitPad
    buyTo = roundMoney(now * (1 - wait), now)
    buyFrom = roundMoney(now * (1 - wait - style.addGap), now)
    basis = pe === null ? '盘口无可用市盈率，按现价回撤带代替' : '盈利为负，不按市盈率定价'
  }

  if (buyFrom > buyTo) {
    const swap = buyFrom
    buyFrom = buyTo
    buyTo = swap
  }

  const canBuyNow = stance === 'constructive' && priceSeat(now, buyFrom, buyTo) !== 'rich'
  const action: SageAction = canBuyNow ? 'buy' : 'wait'
  const addAt = roundMoney(buyFrom * (1 - 0.04), now)
  const trimAt = style.trim === null ? null : roundMoney(now * (1 + style.trim), now)
  const reviewAt = roundMoney(Math.min(buyFrom, now) * (1 - style.review), now)
  const seat = priceSeat(now, buyFrom, buyTo)

  const firstLotPct = action === 'buy' ? style.firstBuy : stance === 'cautious' ? style.firstCautious : style.firstWait
  const maxLotPct = action === 'buy' ? style.maxBuy : stance === 'cautious' ? style.maxCautious : style.maxWait
  const actionLabel =
    action === 'buy'
      ? '可小建仓'
      : seat === 'rich'
        ? stance === 'cautious'
          ? '等待对的价格'
          : '等回调'
        : '价格已到，先核质量'

  const trimText =
    trimAt === null
      ? '上涨本身不是卖出理由'
      : `涨到 ${money(trimAt)}（${vsNow(trimAt, now)}）可减掉一部分，而不是清仓`

  const whenBuy =
    action === 'buy'
      ? `当前 ${money(now)} 已不高于习惯买点 ${money(buyTo)}，第一笔 ${firstLotPct}，总上限 ${maxLotPct}。`
      : seat === 'rich'
        ? `当前 ${money(now)} 先不买。等到跌回 ${money(buyFrom)}–${money(buyTo)} 再下第一笔 ${firstLotPct}，上限 ${maxLotPct}。`
        : `当前 ${money(now)} 已经在习惯带内或更便宜（${money(buyFrom)}–${money(buyTo)}）。先不买是质量或能力圈还没过关，不是等它涨到 ${money(buyTo)}。若质量关过了，第一笔对照 ${firstLotPct}，上限 ${maxLotPct}。`

  const nextStep = `${authorLead(author)}${whenBuy}跌到 ${money(addAt)}（${vsNow(addAt, now)}）再加一笔；${trimText}。跌破 ${money(reviewAt)} 先停手重审，不补仓证明自己是对的。`

  return {
    action,
    actionLabel,
    nowPrice: now,
    buyFrom,
    buyTo,
    addAt,
    trimAt,
    reviewAt,
    firstLotPct,
    maxLotPct,
    peNow: pe,
    peTarget: targetPe,
    nextStep,
    basis,
  }
}

export function formatPlanPrice(value: number | null, stock: QuoteItem): string {
  if (value === null) return '—'
  return formatQuotePrice(value, stock.market)
}

export function formatVsNow(target: number | null, now: number): string {
  if (target === null) return ''
  return vsNow(target, now)
}

export function getStockPe(stock: QuoteItem): number | null {
  const pe = stock.pe ?? stock.peTtm
  if (pe === undefined || !Number.isFinite(pe) || pe === 0) return null
  return pe
}

function authorLead(author: SageAuthorId): string {
  if (author === 'buffett') return '巴菲特框架：'
  if (author === 'munger') return '芒格框架：'
  return '段永平框架：'
}

function vsNow(target: number, now: number): string {
  const pct = ((target - now) / now) * 100
  const n = Math.abs(pct) < 0.5 ? 0 : pct
  return `${n > 0 ? '+' : ''}${n.toFixed(0)}%`
}

function roundMoney(n: number, ref: number): number {
  if (ref >= 100) return Math.round(n * 100) / 100
  if (ref >= 10) return Math.round(n * 100) / 100
  if (ref >= 1) return Math.round(n * 1000) / 1000
  return Math.round(n * 10000) / 10000
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
