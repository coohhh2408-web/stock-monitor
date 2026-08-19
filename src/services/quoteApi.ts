import { jsonp, loadScript } from '@/lib/jsonp'
import { catalogEntryToQuote, searchStockCatalog } from '@/data/stockCatalog'
import { inferMarket, toEastMoneySecid, toTencentSymbol } from '@/services/symbolMap'
import type { QuoteItem, SparklineDataPoint, StockCatalogEntry } from '@/types/market'

interface EastMoneyUList {
  data?: {
    diff?: Array<Record<string, string | number | null>>
  }
}

interface EastMoneySuggest {
  QuotationCodeTable?: {
    Data?: Array<{
      Code?: string
      Name?: string
      QuoteID?: string
      MktNum?: string
      SecurityTypeName?: string
    }>
  }
}

interface EastMoneyTrends {
  data?: {
    trends?: string[]
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '-' || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function mergeLiveQuote(base: QuoteItem, live: Partial<QuoteItem>): QuoteItem {
  const price = live.price ?? base.price
  const open = live.open ?? base.open
  const prevClose = live.prevClose ?? base.prevClose ?? open
  const change = live.change ?? Math.round((price - prevClose) * 100) / 100
  const changePercent =
    live.changePercent ??
    (prevClose ? Math.round((change / prevClose) * 10000) / 100 : base.changePercent)

  return {
    ...base,
    name: live.name || base.name,
    price,
    change,
    changePercent,
    open,
    high: live.high ?? Math.max(base.high, price),
    low: live.low ?? Math.min(base.low, price),
    volume: live.volume ?? base.volume,
    amount: live.amount ?? base.amount,
    turnover: live.turnover ?? base.turnover,
    pe: live.pe ?? base.pe,
    peTtm: live.peTtm ?? base.peTtm,
    pb: live.pb ?? base.pb,
    marketCap: live.marketCap ?? base.marketCap,
    circMarketCap: live.circMarketCap ?? base.circMarketCap,
    amplitude: live.amplitude ?? base.amplitude,
    volumeRatio: live.volumeRatio ?? base.volumeRatio,
    limitUp: live.limitUp ?? base.limitUp,
    limitDown: live.limitDown ?? base.limitDown,
    industry: live.industry ?? base.industry,
    prevClose,
    updatedAt: live.updatedAt ?? new Date().toISOString(),
    secid: live.secid ?? base.secid,
  }
}

function mapEastMoneyRow(row: Record<string, string | number | null>): Partial<QuoteItem> | null {
  const code = String(row.f12 ?? '')
  const price = num(row.f2)
  if (!code || price === null || price <= 0) return null
  const mkt = Number(row.f13)
  const market =
    mkt === 105 ? 'us-stock' : mkt === 116 || mkt === 128 ? 'hk-stock' : mkt === 8 ? 'futures' : 'a-share'
  return {
    code,
    name: String(row.f14 ?? code),
    market,
    price,
    change: num(row.f4) ?? 0,
    changePercent: num(row.f3) ?? 0,
    high: num(row.f15) ?? price,
    low: num(row.f16) ?? price,
    open: num(row.f17) ?? price,
    prevClose: num(row.f18) ?? price,
    volume: num(row.f5) ?? undefined,
    secid: `${mkt}.${code}`,
    updatedAt: new Date().toISOString(),
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

async function fetchEastMoneyQuotes(items: QuoteItem[]): Promise<Partial<QuoteItem>[]> {
  const secids = items
    .map((q) => toEastMoneySecid(q.code, q.market, q.secid))
    .filter(Boolean)
    .slice(0, 80)
  if (secids.length === 0) return []

  const fields = 'f2,f3,f4,f5,f12,f13,f14,f15,f16,f17,f18'
  const query = `fltt=2&invt=2&ut=fa5fd1943c7b386f172d6893dbfba10b&fields=${fields}&secids=${encodeURIComponent(secids.join(','))}`
  const hosts = [
    `https://push2delay.eastmoney.com/api/qt/ulist.np/get?${query}`,
    `https://push2.eastmoney.com/api/qt/ulist.np/get?${query}`,
  ]

  let lastError: unknown
  for (const url of hosts) {
    try {
      const payload = await getJson<EastMoneyUList>(url)
      const rows = payload.data?.diff ?? []
      const mapped = rows.map(mapEastMoneyRow).filter((row): row is Partial<QuoteItem> => !!row)
      if (mapped.length > 0) return mapped
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('eastmoney quotes failed')
}

async function fetchTencentQuotes(items: QuoteItem[]): Promise<Partial<QuoteItem>[]> {
  const symbols = items.map((q) => toTencentSymbol(q.code, q.market)).slice(0, 80)
  if (symbols.length === 0) return []
  await loadScript(`https://qt.gtimg.cn/q=${symbols.join(',')}&_=${Date.now()}`, 'gbk')

  const result: Partial<QuoteItem>[] = []
  for (const q of items) {
    const key = `v_${toTencentSymbol(q.code, q.market)}`
    const raw = (window as unknown as Record<string, string | undefined>)[key]
    if (!raw) continue
    const p = raw.split('~')
    const price = num(p[3])
    if (price === null || price <= 0) continue
    const prevClose = num(p[4]) ?? price
    const open = num(p[5]) ?? price
    const high = num(p[33]) ?? price
    const low = num(p[34]) ?? price
    try {
      delete (window as unknown as Record<string, unknown>)[key]
    } catch {
      /* ignore */
    }
    const amountWan = num(p[37])
    const circYi = num(p[44])
    const capYi = num(p[45])
    result.push({
      code: q.code,
      name: p[1] || q.name,
      market: q.market,
      price,
      prevClose,
      open,
      high,
      low,
      change: Math.round((price - prevClose) * 100) / 100,
      changePercent: prevClose ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0,
      volume: num(p[36]) ?? undefined,
      amount: amountWan !== null ? amountWan * 1e4 : undefined,
      turnover: num(p[38]) ?? undefined,
      pe: num(p[39]) ?? undefined,
      amplitude: num(p[43]) ?? undefined,
      circMarketCap: circYi !== null ? circYi * 1e8 : undefined,
      marketCap: capYi !== null ? capYi * 1e8 : undefined,
      pb: num(p[46]) ?? undefined,
      limitUp: num(p[47]) ?? undefined,
      limitDown: num(p[48]) ?? undefined,
      volumeRatio: num(p[49]) ?? undefined,
      updatedAt: new Date().toISOString(),
    })
  }
  return result
}

export async function fetchLiveQuotes(items: QuoteItem[]): Promise<QuoteItem[]> {
  if (items.length === 0) return []
  let live: Partial<QuoteItem>[] = []
  try {
    live = await fetchTencentQuotes(items)
  } catch {
    live = []
  }
  if (live.length === 0) {
    try {
      live = await fetchEastMoneyQuotes(items)
    } catch {
      live = []
    }
  }

  const byCode = new Map(live.map((row) => [String(row.code), row]))
  if (byCode.size === 0) throw new Error('empty quote payload')
  return items.map((item) => {
    const row = byCode.get(item.code) ?? [...byCode.values()].find((r) => r.name === item.name)
    return row ? mergeLiveQuote(item, row) : item
  })
}

export async function fetchLiveQuote(entry: StockCatalogEntry): Promise<QuoteItem> {
  const placeholder = catalogEntryToQuote(entry)
  const [live] = await fetchLiveQuotes([placeholder])
  return live
}

function mapSuggestMarket(typeName?: string, mktNum?: string): QuoteItem['market'] {
  const t = typeName ?? ''
  if (/美/.test(t) || mktNum === '105') return 'us-stock'
  if (/港/.test(t) || mktNum === '116' || mktNum === '128') return 'hk-stock'
  if (/期/.test(t) || mktNum === '8') return 'futures'
  return 'a-share'
}

async function searchEastMoney(query: string): Promise<StockCatalogEntry[]> {
  const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(query)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8`
  const payload = await jsonp<EastMoneySuggest>(url)
  const rows = payload.QuotationCodeTable?.Data ?? []
  return rows.slice(0, 8).map((row) => {
    const code = String(row.Code ?? '')
    const market = mapSuggestMarket(row.SecurityTypeName, row.MktNum)
    return {
      name: String(row.Name ?? code),
      code,
      market,
      basePrice: 0,
      secid: row.QuoteID || (row.MktNum && code ? `${row.MktNum}.${code}` : undefined),
    }
  }).filter((row) => row.code)
}

function entryFromTypedQuery(query: string): StockCatalogEntry | null {
  const q = query.trim()
  if (/^\d{6}$/.test(q)) {
    return { name: q, code: q, market: inferMarket(q, 'a-share'), basePrice: 0 }
  }
  if (/^\d{5}$/.test(q)) {
    return { name: q, code: q, market: 'hk-stock', basePrice: 0 }
  }
  if (/^[A-Za-z]{1,5}$/.test(q)) {
    return { name: q.toUpperCase(), code: q.toUpperCase(), market: 'us-stock', basePrice: 0 }
  }
  return null
}

export async function searchLiveStocks(
  query: string,
  existingCodes: string[],
  limit = 8,
): Promise<StockCatalogEntry[]> {
  const q = query.trim()
  if (!q) return []

  const local = searchStockCatalog(q, existingCodes, limit)
  const remoteChunks = await Promise.allSettled([searchSina(q), searchEastMoney(q)])
  const remote = remoteChunks.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))

  const typed = entryFromTypedQuery(q)

  const seen = new Set(existingCodes.map((c) => c.toUpperCase()))
  const merged: StockCatalogEntry[] = []
  for (const item of [...local, ...remote, ...(typed ? [typed] : [])]) {
    const key = item.code.toUpperCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push({ ...item, market: inferMarket(item.code, item.market) })
    if (merged.length >= limit) break
  }
  return merged
}

async function searchSina(query: string): Promise<StockCatalogEntry[]> {
  const name = `__sm_suggest_${Date.now()}`
  await loadScript(
    `https://suggest3.sinajs.cn/suggest/type=11,12,13,14,15,21,22,31&key=${encodeURIComponent(query)}&name=${name}`,
    'gbk',
  )
  const raw = (window as unknown as Record<string, string | undefined>)[name] ?? ''
  try {
    delete (window as unknown as Record<string, unknown>)[name]
  } catch {
    /* ignore */
  }
  if (!raw) return []

  return raw
    .split(';')
    .map((chunk) => chunk.split(','))
    .filter((parts) => parts.length >= 4)
    .slice(0, 8)
    .map((parts) => {
      const type = parts[1]
      const rawCode = (parts[3] || parts[2] || '').replace(/^(sh|sz|bj|hk|gb_)/i, '')
      const displayName = parts[4] || parts[0] || rawCode
      const market: QuoteItem['market'] =
        type === '31' ? 'us-stock' : type === '21' || type === '22' ? 'hk-stock' : 'a-share'
      const code =
        market === 'us-stock'
          ? rawCode.toUpperCase()
          : market === 'hk-stock'
            ? rawCode.replace(/\D/g, '').padStart(5, '0')
            : rawCode.replace(/\D/g, '') || rawCode
      return { name: displayName, code, market, basePrice: 0 }
    })
    .filter((row) => row.code && row.name)
}

export async function fetchIntradaySparkline(quote: QuoteItem): Promise<SparklineDataPoint[] | null> {
  const secid = toEastMoneySecid(quote.code, quote.market, quote.secid)
  const url = `https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${encodeURIComponent(secid)}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ndays=1&iscr=0`
  try {
    const payload = await getJson<EastMoneyTrends>(url)
    const trends = payload.data?.trends ?? []
    if (trends.length === 0) return null
    const step = Math.max(1, Math.floor(trends.length / 48))
    return trends.filter((_, i) => i % step === 0 || i === trends.length - 1).map((line) => {
      const [time, , price] = line.split(',')
      return {
        time: time.slice(11, 16),
        price: Number(price),
      }
    }).filter((p) => Number.isFinite(p.price))
  } catch {
    return null
  }
}
