import { BUSINESS_KIND_LABEL, inferBusinessKind, type BusinessKind } from '@/services/buffettMunger'
import { PE_BAND } from '@/services/sagePlan'
import type { QuoteItem } from '@/types/market'

export type ScreenerPreset = 'in-band' | 'near' | 'franchise' | 'bank' | 'utility' | 'all'

export type ScreenerStatus = 'in-band' | 'near' | 'far'

export interface ScreenerHit {
  quote: QuoteItem
  kind: BusinessKind
  kindLabel: string
  peNow: number
  peHabit: number
  habitPrice: number
  status: ScreenerStatus
  statusLabel: string
  vsHabit: number
}

export const SCREENER_PRESETS: { id: ScreenerPreset; label: string; hint: string }[] = [
  { id: 'in-band', label: '进入习惯带', hint: '已归类，且市盈率落在该生意习惯买点内。不是荐股。' },
  { id: 'near', label: '离习惯带不远', hint: '已归类，倍数高于习惯买点、但还没到过热上沿。' },
  { id: 'franchise', label: '消费特许经营权', hint: '名称/行业被归为特许经营权。仍要自己看价格。' },
  { id: 'bank', label: '银行', hint: '名称或行业带「银行」。' },
  { id: 'utility', label: '公用事业', hint: '电力、燃气、水务等。' },
  { id: 'all', label: '全部样本', hint: '当前市场市值靠前、且有可用市盈率的样本。' },
]

export function scoreScreenerQuote(quote: QuoteItem): ScreenerHit | null {
  const peNow = quote.peTtm ?? quote.pe
  if (peNow === undefined || !Number.isFinite(peNow) || peNow <= 0) return null
  const kind = inferBusinessKind(quote)
  if (kind === 'futures') return null
  const band = PE_BAND[kind]
  const peHabit = band.buy
  const habitPrice = roundMoney(quote.price * (peHabit / peNow), quote.price)
  const status: ScreenerStatus = peNow <= peHabit ? 'in-band' : peNow <= band.stretch ? 'near' : 'far'
  const statusLabel = status === 'in-band' ? '进入习惯带' : status === 'near' ? '离习惯带不远' : '离习惯带较远'
  return {
    quote,
    kind,
    kindLabel: BUSINESS_KIND_LABEL[kind],
    peNow,
    peHabit,
    habitPrice,
    status,
    statusLabel,
    vsHabit: peNow / peHabit,
  }
}

export function runScreener(quotes: QuoteItem[], preset: ScreenerPreset): ScreenerHit[] {
  const hits = quotes.map(scoreScreenerQuote).filter((row): row is ScreenerHit => row !== null)
  const filtered = hits.filter((row) => matchPreset(row, preset))
  return filtered.sort((a, b) => {
    if (a.status !== b.status) {
      const rank = { 'in-band': 0, near: 1, far: 2 }
      return rank[a.status] - rank[b.status]
    }
    return a.vsHabit - b.vsHabit
  })
}

function matchPreset(row: ScreenerHit, preset: ScreenerPreset): boolean {
  const classified = row.kind !== 'unknown'
  if (preset === 'in-band') return classified && row.status === 'in-band'
  if (preset === 'near') return classified && row.status === 'near'
  if (preset === 'franchise') return row.kind === 'consumer-franchise'
  if (preset === 'bank') return row.kind === 'bank'
  if (preset === 'utility') return row.kind === 'utility'
  return true
}

export interface ScreenerPick {
  preset: ScreenerPreset
  presetLabel: string
  kindLabel: string
  peNow: number
  peHabit: number
  statusLabel: string
  habitPrice: number
  logic: string
}

export function toScreenerPick(hit: ScreenerHit, preset: ScreenerPreset): ScreenerPick {
  const presetLabel = SCREENER_PRESETS.find((item) => item.id === preset)?.label ?? '选股'
  return {
    preset,
    presetLabel,
    kindLabel: hit.kindLabel,
    peNow: hit.peNow,
    peHabit: hit.peHabit,
    statusLabel: hit.statusLabel,
    habitPrice: hit.habitPrice,
    logic: `入选「${presetLabel}」。按名称和行业归为「${hit.kindLabel}」，这门生意的习惯市盈率约 ${hit.peHabit.toFixed(0)} 倍，当前约 ${hit.peNow.toFixed(0)} 倍，所以是${hit.statusLabel}。样本只覆盖市值靠前、且有市盈率的股票，不是全市场穷举，也不是荐股。三人短评是同一套框架的对照，不是大师原话。`,
  }
}

function roundMoney(n: number, ref: number): number {
  if (ref >= 10) return Math.round(n * 100) / 100
  if (ref >= 1) return Math.round(n * 1000) / 1000
  return Math.round(n * 10000) / 10000
}
