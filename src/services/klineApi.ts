import { toEastMoneySecid } from '@/services/symbolMap'
import type { ChartPeriod, KlineBar, QuoteItem } from '@/types/market'

interface EastMoneyKline {
  data?: {
    klines?: string[]
    preKPrice?: number
  }
}

interface EastMoneyTrends {
  data?: {
    trends?: string[]
    preClose?: number
    prePrice?: number
  }
}

interface EastMoneySnapshot {
  data?: Record<string, string | number | null>
}

const UT = 'fa5fd1943c7b386f172d6893dbfba10b'

const PERIOD_KLT: Record<Exclude<ChartPeriod, 'intraday' | '5d'>, number> = {
  day: 101,
  week: 102,
  month: 103,
}

function usesDevProxy(): boolean {
  return typeof window !== 'undefined' && window.location.port === '5173'
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '-' || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

async function getJsonFallback<T>(urls: string[]): Promise<T> {
  let last: unknown
  for (const url of urls) {
    try {
      const payload = await getJson<T>(url)
      return payload
    } catch (err) {
      last = err
    }
  }
  throw last instanceof Error ? last : new Error('行情数据请求失败')
}

function hisUrls(path: string): string[] {
  const qs = path.startsWith('/') ? path : `/${path}`
  const remote = [`https://push2his.eastmoney.com${qs}`]
  return usesDevProxy() ? [...remote, `/em-his${qs}`] : remote
}

function qtUrls(path: string): string[] {
  const qs = path.startsWith('/') ? path : `/${path}`
  const remote = [
    `https://push2.eastmoney.com${qs}`,
    `https://push2delay.eastmoney.com${qs}`,
  ]
  return usesDevProxy() ? [...remote, `/em-qt${qs}`] : remote
}

function parseKlineLine(line: string, withPercent = true): KlineBar | null {
  const p = line.split(',')
  const open = num(p[1])
  const close = num(p[2])
  const high = num(p[3])
  const low = num(p[4])
  const volume = num(p[5])
  if (!p[0] || open === null || close === null || high === null || low === null) return null
  return {
    time: p[0],
    open,
    close,
    high,
    low,
    volume: volume ?? 0,
    amount: num(p[6]) ?? undefined,
    changePercent: withPercent ? num(p[8]) ?? undefined : undefined,
  }
}

function downsample<T>(items: T[], max = 360): T[] {
  if (items.length <= max) return items
  const step = Math.ceil(items.length / max)
  const out: T[] = []
  for (let i = 0; i < items.length; i += step) out.push(items[i])
  const last = items[items.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

async function fetchTrends(quote: QuoteItem, ndays: 1 | 5): Promise<{ bars: KlineBar[]; prevClose?: number }> {
  const secid = toEastMoneySecid(quote.code, quote.market, quote.secid)
  const path =
    `/api/qt/stock/trends2/get?secid=${encodeURIComponent(secid)}` +
    `&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13` +
    `&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ndays=${ndays}&iscr=0&ut=${UT}`
  const payload = await getJsonFallback<EastMoneyTrends>(qtUrls(path))
  const trends = payload.data?.trends ?? []
  const bars = downsample(trends.map((line) => parseKlineLine(line, false)).filter((b): b is KlineBar => !!b), ndays === 5 ? 420 : 480)
  return {
    bars,
    prevClose: num(payload.data?.preClose) ?? num(payload.data?.prePrice) ?? quote.prevClose,
  }
}

async function fetchHistory(quote: QuoteItem, period: 'day' | 'week' | 'month'): Promise<KlineBar[]> {
  const secid = toEastMoneySecid(quote.code, quote.market, quote.secid)
  const klt = PERIOD_KLT[period]
  const lmt = period === 'month' ? 60 : 90
  const path =
    `/api/qt/stock/kline/get?secid=${encodeURIComponent(secid)}` +
    `&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61` +
    `&klt=${klt}&fqt=1&end=20500101&lmt=${lmt}&ut=${UT}`
  const payload = await getJsonFallback<EastMoneyKline>(hisUrls(path))
  return (payload.data?.klines ?? []).map(parseKlineLine).filter((b): b is KlineBar => !!b)
}

export async function fetchChartSeries(
  quote: QuoteItem,
  period: ChartPeriod,
): Promise<{ bars: KlineBar[]; prevClose?: number }> {
  if (period === 'intraday') return fetchTrends(quote, 1)
  if (period === '5d') return fetchTrends(quote, 5)
  const bars = await fetchHistory(quote, period)
  return { bars, prevClose: quote.prevClose }
}

export async function fetchQuoteSnapshot(quote: QuoteItem): Promise<QuoteItem> {
  const secid = toEastMoneySecid(quote.code, quote.market, quote.secid)
  const fields = [
    'f43', 'f44', 'f45', 'f46', 'f47', 'f48', 'f50', 'f51', 'f52',
    'f57', 'f58', 'f60', 'f116', 'f117', 'f127',
    'f162', 'f163', 'f164', 'f167', 'f168', 'f169', 'f170', 'f171',
  ].join(',')
  const path = `/api/qt/stock/get?invt=2&fltt=2&secid=${encodeURIComponent(secid)}&fields=${fields}&ut=${UT}`
  const payload = await getJsonFallback<EastMoneySnapshot>(qtUrls(path))
  const row = payload.data
  if (!row) return quote

  const price = num(row.f43) ?? quote.price
  const prevClose = num(row.f60) ?? quote.prevClose ?? quote.open
  const peDyn = num(row.f162)
  const peTtm = num(row.f163) ?? num(row.f164)
  const mapped: Partial<QuoteItem> = {
    name: String(row.f58 || quote.name),
    price,
    high: num(row.f44) ?? quote.high,
    low: num(row.f45) ?? quote.low,
    open: num(row.f46) ?? quote.open,
    volume: num(row.f47) ?? quote.volume,
    amount: num(row.f48) ?? quote.amount,
    volumeRatio: num(row.f50) ?? quote.volumeRatio,
    limitUp: num(row.f51) ?? quote.limitUp,
    limitDown: num(row.f52) ?? quote.limitDown,
    prevClose,
    marketCap: num(row.f116) ?? quote.marketCap,
    circMarketCap: num(row.f117) ?? quote.circMarketCap,
    industry: row.f127 && row.f127 !== '-' ? String(row.f127) : quote.industry,
    pe: peDyn ?? peTtm ?? quote.pe,
    peTtm: peTtm ?? quote.peTtm,
    pb: num(row.f167) ?? quote.pb,
    turnover: num(row.f168) ?? quote.turnover,
    change: num(row.f169) ?? quote.change,
    changePercent: num(row.f170) ?? quote.changePercent,
    amplitude: num(row.f171) ?? quote.amplitude,
    secid,
    updatedAt: new Date().toISOString(),
  }
  const change = mapped.change ?? Math.round((price - prevClose) * 100) / 100
  const changePercent =
    mapped.changePercent ??
    (prevClose ? Math.round((change / prevClose) * 10000) / 100 : quote.changePercent)

  return {
    ...quote,
    ...mapped,
    change,
    changePercent,
  }
}

export function isCandlePeriod(period: ChartPeriod): boolean {
  return period === 'day' || period === 'week' || period === 'month'
}
