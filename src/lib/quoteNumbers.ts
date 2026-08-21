/** 盘口数字：空值和占位符不当数。 */
export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '-' || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** 成交、换手、振幅等不能是 0。盘前东财常给 0.0，不能盖掉腾讯的真值。 */
export function parsePositiveNumber(value: unknown): number | null {
  const n = parseNumber(value)
  if (n === null || n <= 0) return null
  return n
}

export function formatPercentRate(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return '—'
  return `${value.toFixed(2)}%`
}

/** 今开颜色对比昨收，不是对比现价。 */
export function openVsPrevAccent(open: number, prevClose: number | undefined): 'up' | 'down' | 'none' {
  const prev = prevClose ?? open
  if (open > prev) return 'up'
  if (open < prev) return 'down'
  return 'none'
}

export function deriveTurnover(amount?: number, circMarketCap?: number): number | undefined {
  if (!amount || !circMarketCap || amount <= 0 || circMarketCap <= 0) return undefined
  return Math.round((amount / circMarketCap) * 10000) / 100
}

export interface TencentQuoteFields {
  name: string
  price: number
  prevClose: number
  open: number
  high: number
  low: number
  change: number
  changePercent: number
  volume?: number
  amount?: number
  turnover?: number
  pe?: number
  peTtm?: number
  amplitude?: number
  circMarketCap?: number
  marketCap?: number
  pb?: number
  limitUp?: number
  limitDown?: number
  volumeRatio?: number
}

/** 腾讯 qt.gtimg.cn 按 ~ 切开后的字段。 */
export function parseTencentQuoteFields(raw: string): TencentQuoteFields | null {
  const p = raw.replace(/^[^"]*"|"[^"]*$/g, '').split('~')
  const price = parsePositiveNumber(p[3])
  if (price === null) return null
  const prevClose = parsePositiveNumber(p[4]) ?? price
  const open = parsePositiveNumber(p[5]) ?? price
  const amountWan = parsePositiveNumber(p[37])
  const circYi = parsePositiveNumber(p[44])
  const capYi = parsePositiveNumber(p[45])
  const amount = amountWan !== null ? amountWan * 1e4 : undefined
  const circMarketCap = circYi !== null ? circYi * 1e8 : undefined
  return {
    name: p[1] || '',
    price,
    prevClose,
    open,
    high: parsePositiveNumber(p[33]) ?? price,
    low: parsePositiveNumber(p[34]) ?? price,
    change: Math.round((price - prevClose) * 100) / 100,
    changePercent: prevClose ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0,
    volume: parsePositiveNumber(p[36]) ?? undefined,
    amount,
    turnover: parsePositiveNumber(p[38]) ?? deriveTurnover(amount, circMarketCap),
    pe: parseNumber(p[52]) ?? parseNumber(p[39]) ?? undefined,
    peTtm: parseNumber(p[53]) ?? undefined,
    amplitude: parsePositiveNumber(p[43]) ?? undefined,
    circMarketCap,
    marketCap: capYi !== null ? capYi * 1e8 : undefined,
    pb: parsePositiveNumber(p[46]) ?? undefined,
    limitUp: parsePositiveNumber(p[47]) ?? undefined,
    limitDown: parsePositiveNumber(p[48]) ?? undefined,
    volumeRatio: parsePositiveNumber(p[49]) ?? undefined,
  }
}
