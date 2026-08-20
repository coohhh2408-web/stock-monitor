import { usesDevProxy } from '@/lib/devProxy'
import type { QuoteItem } from '@/types/market'

export type ScreenerMarket = 'a-share' | 'hk-stock' | 'us-stock'

interface ClistPayload {
  data?: {
    total?: number
    diff?: Array<Record<string, string | number | null>>
  }
}

const FS: Record<ScreenerMarket, string> = {
  'a-share': 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
  'hk-stock': 'm:116+t:3',
  'us-stock': 'm:105+t:1',
}

const PAGE_SIZE = 100
const PAGES = 2

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '-' || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function mapMarket(mkt: number): QuoteItem['market'] | null {
  if (mkt === 105 || mkt === 106 || mkt === 107) return 'us-stock'
  if (mkt === 116 || mkt === 128) return 'hk-stock'
  if (mkt === 0 || mkt === 1) return 'a-share'
  return null
}

function junkName(name: string): boolean {
  return /ST|\*ST|^N|^C|权证|购A|购B|-R$|Wt|Pfd|ETF|LOF|基金|信托|债|购回/i.test(name)
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

function clistUrls(query: string): string[] {
  const urls = [`https://push2delay.eastmoney.com/api/qt/clist/get?${query}`]
  if (usesDevProxy()) urls.push(`/em-qt/api/qt/clist/get?${query}`)
  urls.push(`https://push2.eastmoney.com/api/qt/clist/get?${query}`)
  return urls
}

async function fetchClistPage(market: ScreenerMarket, page: number): Promise<QuoteItem[]> {
  const fields = 'f2,f3,f4,f9,f12,f13,f14,f20,f100,f115'
  const query = [
    'fltt=2',
    'invt=2',
    'np=1',
    `pn=${page}`,
    `pz=${PAGE_SIZE}`,
    'po=1',
    'fid=f20',
    `fs=${encodeURIComponent(FS[market])}`,
    `fields=${fields}`,
    `ut=fa5fd1943c7b386f172d6893dbfba10b`,
  ].join('&')

  let lastError: unknown
  for (const url of clistUrls(query)) {
    try {
      const payload = await getJson<ClistPayload>(url)
      const rows = payload.data?.diff
      if (!rows) continue
      return rows.map(mapRow).filter((row): row is QuoteItem => row !== null)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('选股列表拉取失败')
}

function mapRow(row: Record<string, string | number | null>): QuoteItem | null {
  const code = String(row.f12 ?? '')
  const name = String(row.f14 ?? '')
  const price = num(row.f2)
  const mkt = Number(row.f13)
  const market = mapMarket(mkt)
  if (!code || !name || !market || price === null || price <= 0) return null
  if (junkName(name)) return null
  const pe = num(row.f115) ?? num(row.f9)
  if (pe === null || pe <= 0 || pe > 80) return null
  const changePercent = num(row.f3) ?? 0
  const change = num(row.f4) ?? 0
  return {
    id: `${market}:${code}`,
    name,
    code,
    market,
    price,
    change,
    changePercent,
    open: price,
    high: price,
    low: price,
    pe,
    peTtm: pe,
    marketCap: num(row.f20) ?? undefined,
    industry: row.f100 && row.f100 !== '-' ? String(row.f100) : undefined,
    secid: Number.isFinite(mkt) ? `${mkt}.${code}` : undefined,
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchScreenerUniverse(market: ScreenerMarket): Promise<QuoteItem[]> {
  const pages = await Promise.all(
    Array.from({ length: PAGES }, (_, i) => fetchClistPage(market, i + 1)),
  )
  const seen = new Set<string>()
  const out: QuoteItem[] = []
  for (const page of pages) {
    for (const row of page) {
      const key = `${row.market}:${row.code}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(row)
    }
  }
  return out
}
