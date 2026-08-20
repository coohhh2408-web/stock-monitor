import { formatVsNow } from '@/services/sagePlan'
import { buildValueChecklist, type ValueChecklist } from '@/services/valueChecklist'
import type { FinancialPeriod, QuoteItem } from '@/types/market'

/** 击球点：好球区（质量关未过关为 0，且有内置质量说明）+ 甜蜜点（进入习惯买点带）。 */
export type StrikeLane = 'zone' | 'sweet' | 'out'

export interface StrikeHit {
  stock: QuoteItem
  lane: StrikeLane
  peNow: number | null
  habitPrice: number | null
  vsNow: string
  note: string
}

export interface StrikeScan {
  zone: StrikeHit[]
  sweet: StrikeHit[]
  scanned: number
  skipped: number
}

export function classifyStrike(checklist: ValueChecklist): StrikeLane {
  const { skill } = checklist
  if (skill.filter === 'skip') return 'out'
  const inBand = skill.gates.find((g) => g.id === 8)?.answer === 'yes'
  if (!inBand) return 'out'
  if (skill.qualityNoCount === 0 && skill.knownProfile) return 'zone'
  return 'sweet'
}

export function scanStrikeZone(quotes: QuoteItem[], financialsByCode?: Map<string, FinancialPeriod | null>): StrikeScan {
  const zone: StrikeHit[] = []
  const sweet: StrikeHit[] = []
  let skipped = 0

  for (const stock of quotes) {
    const period = financialsByCode?.get(stock.code)
    const checklist = buildValueChecklist(stock, period)
    const lane = classifyStrike(checklist)
    if (lane === 'out') {
      if (checklist.skill.filter === 'skip') skipped += 1
      continue
    }
    const hit: StrikeHit = {
      stock,
      lane,
      peNow: checklist.peNow,
      habitPrice: checklist.habitPrice,
      vsNow: formatVsNow(checklist.habitPrice, stock.price),
      note:
        lane === 'zone'
          ? '好球区未过关为 0，且现价进入习惯买点带。倍数到了 ≠ 该买。'
          : checklist.skill.qualityNoCount > 0
            ? '倍数到了，但质量关已有未过关，不算击球点。'
            : '倍数到了，质量关多为未知，只能算估值习惯。',
    }
    if (lane === 'zone') zone.push(hit)
    else sweet.push(hit)
  }

  const byDiscount = (a: StrikeHit, b: StrikeHit) => {
    const av = a.habitPrice !== null && a.stock.price > 0 ? a.habitPrice / a.stock.price : 0
    const bv = b.habitPrice !== null && b.stock.price > 0 ? b.habitPrice / b.stock.price : 0
    return bv - av
  }
  zone.sort(byDiscount)
  sweet.sort(byDiscount)

  return { zone, sweet, scanned: quotes.length, skipped }
}
