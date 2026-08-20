import type { QuoteItem, StockCatalogEntry } from '@/types/market'

export type QuoteMarket = QuoteItem['market']

export function inferMarket(code: string, hint?: QuoteMarket): QuoteMarket {
  if (hint) return hint
  const c = code.trim().toUpperCase()
  if (/^[A-Z]{1,5}$/.test(c)) return 'us-stock'
  if (/^(IF|IC|IH|IM|T|TF|TS|TL)\d{3,4}$/i.test(c)) return 'futures'
  if (/^\d{5}$/.test(c)) return 'hk-stock'
  return 'a-share'
}

export function toEastMoneySecid(code: string, market?: QuoteMarket, secid?: string): string {
  const c = code.trim()
  const computed = computeEastMoneySecid(c, market)
  if (!secid) return computed
  const givenPrefix = secid.split('.')[0]
  const computedPrefix = computed.split('.')[0]
  // 东财列表偶发把沪市 6 开头标成 0.xxxxxx，K 线会空。
  if (givenPrefix !== computedPrefix && (market === 'a-share' || /^\d{6}$/.test(c))) return computed
  return secid
}

function computeEastMoneySecid(code: string, market?: QuoteMarket): string {
  const c = code.trim()
  const m = inferMarket(c, market)
  if (m === 'us-stock') return `105.${c.toUpperCase()}`
  if (m === 'hk-stock') return `116.${c.padStart(5, '0')}`
  if (m === 'futures') return `8.${c.toUpperCase()}`
  if (/^[69]/.test(c) || c.startsWith('688')) return `1.${c}`
  return `0.${c}`
}

export function toTencentSymbol(code: string, market?: QuoteMarket): string {
  const c = code.trim()
  const m = inferMarket(c, market)
  if (m === 'us-stock') return `us${c.toUpperCase()}`
  if (m === 'hk-stock') return `hk${c.padStart(5, '0')}`
  if (m === 'futures') return `nf${c}`
  if (/^[69]/.test(c) || c.startsWith('688')) return `sh${c}`
  if (/^[48]/.test(c) && c.length === 6) return `bj${c}`
  return `sz${c}`
}

export function catalogKey(entry: Pick<StockCatalogEntry, 'code' | 'market'>): string {
  return `${entry.market}:${entry.code}`
}
