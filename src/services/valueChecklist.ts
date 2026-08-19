import { formatQuotePrice } from '@/lib/utils'
import { inferBusinessKind, type BusinessKind } from '@/services/buffettMunger'
import { buildSagePlan, getStockPe, PE_BAND } from '@/services/sagePlan'
import type { QuoteItem } from '@/types/market'

export type ChecklistVerdict = 'in-band' | 'wait' | 'skip' | 'no-data'

export type GateState = 'pass' | 'warn' | 'fail' | 'na'

export interface ChecklistGate {
  id: string
  label: string
  state: GateState
  note: string
}

export interface HabitLens {
  author: '巴菲特' | '芒格' | '段永平'
  actionLabel: string
  buyTo: number | null
  oneLiner: string
}

export interface ValueChecklist {
  kind: BusinessKind
  kindLabel: string
  verdict: ChecklistVerdict
  headline: string
  reason: string
  peNow: number | null
  peHabit: number | null
  habitPrice: number | null
  formula: string
  gates: ChecklistGate[]
  lenses: HabitLens[]
}

const KIND_LABEL: Record<BusinessKind, string> = {
  'consumer-franchise': '消费特许经营权',
  bank: '银行',
  insurance: '保险',
  platform: '平台',
  semiconductor: '半导体',
  'ev-battery': '电池制造',
  commodity: '商品周期',
  auto: '整车',
  solar: '光伏制造',
  pharma: '医药',
  telecom: '电信',
  utility: '公用事业',
  realty: '房地产',
  manufacturing: '制造',
  futures: '期货合约',
  unknown: '未归类',
}

const HARD_SKIP: BusinessKind[] = ['futures']
const WEAK_FIT: BusinessKind[] = ['commodity', 'auto', 'solar', 'realty', 'ev-battery', 'semiconductor']

export function buildValueChecklist(stock: QuoteItem): ValueChecklist {
  const kind = inferBusinessKind(stock)
  const kindLabel = KIND_LABEL[kind]
  const peNow = getStockPe(stock)
  const band = kind === 'futures' ? null : PE_BAND[kind]
  const peHabit = band?.buy ?? null
  const habitPrice =
    peNow !== null && peNow > 0 && peHabit !== null
      ? roundMoney(stock.price * (peHabit / peNow), stock.price)
      : null

  const lenses: HabitLens[] = (
    [
      ['巴菲特', 'buffett', 'constructive'],
      ['芒格', 'munger', 'cautious'],
      ['段永平', 'duan', 'cautious'],
    ] as const
  ).map(([author, id, stance]) => {
    const plan = buildSagePlan(stock, kind, kind === 'futures' ? 'skeptical' : stance, id)
    return {
      author,
      actionLabel: plan.actionLabel,
      buyTo: plan.buyTo,
      oneLiner: plan.basis,
    }
  })

  if (HARD_SKIP.includes(kind)) {
    return pack({
      kind,
      kindLabel,
      verdict: 'skip',
      headline: '这套清单不适用',
      reason: '买的是合约，不是可以长期持有的企业。',
      peNow,
      peHabit: null,
      habitPrice: null,
      formula: '不报价。',
      gates: [
        gate('fit', '生意类型', 'fail', kindLabel),
        gate('pe', '估值', 'na', '不按市盈率定价'),
        gate('price', '习惯买点', 'fail', '不适用'),
        gate('data', '数据', peNow ? 'pass' : 'warn', peNow ? `现 ${peNow.toFixed(0)}x` : '无市盈率'),
      ],
      lenses,
    })
  }

  if (peNow === null || peHabit === null || habitPrice === null) {
    return pack({
      kind,
      kindLabel,
      verdict: 'no-data',
      headline: '没有市盈率，先不报价',
      reason: `生意类型按名称归为「${kindLabel}」。缺盈利倍数时，不算习惯买点，避免编数字。`,
      peNow,
      peHabit,
      habitPrice: null,
      formula: '买点 = 现价 ×（习惯市盈率 ÷ 当前市盈率）。当前缺市盈率。',
      gates: [
        gate('fit', '生意类型', WEAK_FIT.includes(kind) ? 'warn' : 'pass', kindLabel),
        gate('pe', '估值', 'na', '盘口无可用市盈率'),
        gate('price', '习惯买点', 'na', '不算价'),
        gate('data', '数据', 'fail', '缺市盈率'),
      ],
      lenses,
    })
  }

  const stretch = band!.stretch
  const inBand = peNow <= peHabit
  const far = peNow > stretch
  const verdict: ChecklistVerdict = inBand ? 'in-band' : 'wait'
  const vs = ((habitPrice - stock.price) / stock.price) * 100
  const headline = inBand ? '进入习惯买点带' : '未到习惯买点'
  const reason = inBand
    ? `当前约 ${peNow.toFixed(0)} 倍，落在这门生意 ${peHabit.toFixed(0)} 倍的习惯买点内。这只说明倍数到了，不说明该买。`
    : `当前约 ${peNow.toFixed(0)} 倍，习惯买点约 ${peHabit.toFixed(0)} 倍，对应 ${formatQuotePrice(habitPrice, stock.market)}（${vs.toFixed(0)}%）。${far ? '离买点较远。' : ''}${WEAK_FIT.includes(kind) ? '这类生意本身也更不宜用特许经营权的标准硬套。' : ''}`

  return pack({
    kind,
    kindLabel,
    verdict,
    headline,
    reason,
    peNow,
    peHabit,
    habitPrice,
    formula: `${formatQuotePrice(stock.price, stock.market)} ×（${peHabit.toFixed(0)} ÷ ${peNow.toFixed(0)}）= ${formatQuotePrice(habitPrice, stock.market)}`,
    gates: [
      gate('fit', '生意类型', WEAK_FIT.includes(kind) ? 'warn' : 'pass', kindLabel),
      gate('pe', '估值', inBand ? 'pass' : far ? 'fail' : 'warn', `现 ${peNow.toFixed(0)}x · 习惯 ${peHabit.toFixed(0)}x`),
      gate('price', '习惯买点', inBand ? 'pass' : 'warn', formatQuotePrice(habitPrice, stock.market)),
      gate('data', '数据', 'pass', '与上方盘口同一路市盈率'),
    ],
    lenses,
  })
}

function pack(brief: ValueChecklist): ValueChecklist {
  return brief
}

function gate(id: string, label: string, state: GateState, note: string): ChecklistGate {
  return { id, label, state, note }
}

function roundMoney(n: number, ref: number): number {
  if (ref >= 10) return Math.round(n * 100) / 100
  if (ref >= 1) return Math.round(n * 1000) / 1000
  return Math.round(n * 10000) / 10000
}
