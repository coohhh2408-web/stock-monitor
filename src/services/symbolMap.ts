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
  if (secid) return secid
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
