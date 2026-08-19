import { canBypassBrowserCors, usesDevProxy, usesNativeHttp } from '@/lib/devProxy'
import { loadScript } from '@/lib/jsonp'
import { md5OfSha1Hex } from '@/lib/md5'
import { formatListedCode } from '@/lib/utils'
import type { AnnouncementItem, QuoteItem, SentimentTag } from '@/types/market'

const BULLISH = /涨|净买入|增长|利好|超预期|创新高|回购|增持|上调|盈利|翻红|突破|大涨|走强/
const BEARISH = /跌|减持|亏损|下调|利空|暴跌|承压|调查|处罚|退市|爆仓|大跌|走弱|下滑/

function inferSentiment(text: string): SentimentTag {
  if (BULLISH.test(text) && !BEARISH.test(text)) return 'bullish'
  if (BEARISH.test(text) && !BULLISH.test(text)) return 'bearish'
  return 'neutral'
}

function formatNewsTime(raw: string | number): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw
    return new Date(ms).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  const text = String(raw)
  const match = text.match(/(\d{2}:\d{2})/)
  if (match) return match[1]
  const date = new Date(text.replace(/-/g, '/'))
  if (Number.isNaN(date.getTime())) return text.slice(11, 16) || text
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function extractTag(title: string, quotes: QuoteItem[]): string {
  const bracket = title.match(/【([^】]{1,12})】/)
  if (bracket) return bracket[1]
  const hit = quotes.find((q) => title.includes(q.name) || title.includes(q.code))
  if (hit) return hit.name
  const beforeColon = title.split(/[：:]/)[0]?.trim()
  if (beforeColon && beforeColon.length <= 8 && beforeColon !== title) return beforeColon
  return '快讯'
}

async function readText(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function readJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

function parseAjaxResult(text: string): { LivesList?: Array<Record<string, string>> } {
  const json = text.replace(/^\s*var\s+ajaxResult\s*=\s*/, '').replace(/;?\s*$/, '')
  return JSON.parse(json) as { LivesList?: Array<Record<string, string>> }
}

function mapKuaixun(rows: Array<Record<string, string>>, quotes: QuoteItem[]): AnnouncementItem[] {
  return rows
    .map((row) => {
      const title = (row.simtitle || row.title || '').trim()
      const digest = (row.digest || row.simdigest || title).trim()
      return {
        id: row.id || row.newsid || title,
        title,
        date: formatNewsTime(row.showtime || row.ordertime || ''),
        type: 'news' as const,
        sentiment: inferSentiment(`${title} ${digest}`),
        tag: extractTag(digest || title, quotes),
        url: row.url_m || row.url_w,
        summary: digest,
      }
    })
    .filter((item) => item.title)
}

async function fetchKuaixunRaw(): Promise<Array<Record<string, string>>> {
  const path = '/kuaixun/v1/getlist_102_ajaxResult_50_1_.html'
  const urls = usesDevProxy()
    ? [`/em-kuaixun${path}`, `https://newsapi.eastmoney.com${path}`]
    : [`https://newsapi.eastmoney.com${path}`]

  for (const url of urls) {
    try {
      const parsed = parseAjaxResult(await readText(url))
      if (parsed.LivesList?.length) return parsed.LivesList
    } catch {
      /* try next */
    }
  }

  try {
    await loadScript(`https://newsapi.eastmoney.com${path}`)
    const data = (window as unknown as { ajaxResult?: { LivesList?: Array<Record<string, string>> } }).ajaxResult
    ;(window as unknown as { ajaxResult?: unknown }).ajaxResult = undefined
    if (data?.LivesList?.length) return data.LivesList
  } catch {
    /* fall through */
  }
  return []
}

async function fetchSinaFlash(): Promise<AnnouncementItem[]> {
  const path = '/api/zhibo/feed?page=1&page_size=40&zhibo_id=152&tag_id=0&dire=f'
  const urls = usesDevProxy()
    ? [`/sina-zhibo${path}`, `https://zhibo.sina.com.cn${path}`]
    : [`https://zhibo.sina.com.cn${path}`]

  for (const url of urls) {
    try {
      const payload = await readJson<{
        result?: {
          data?: {
            feed?: {
              list?: Array<{
                id: number
                rich_text: string
                create_time: string
                docurl?: string
                tag?: Array<{ name: string }>
              }>
            }
          }
        }
      }>(url)
      const list = payload.result?.data?.feed?.list ?? []
      return list.map((row) => {
        const title = row.rich_text.replace(/<[^>]+>/g, '').trim()
        return {
          id: `sina-${row.id}`,
          title,
          date: formatNewsTime(row.create_time),
          type: 'news' as const,
          sentiment: inferSentiment(title),
          tag: row.tag?.[0]?.name || extractTag(title, []),
          url: row.docurl,
          summary: title,
        }
      })
    } catch {
      /* try next */
    }
  }
  return []
}

/** 华尔街见闻 7×24，接口带 CORS，隧道和静态部署都能直接拉。 */
async function fetchWallstreetcnFlash(quotes: QuoteItem[]): Promise<AnnouncementItem[]> {
  const urls = [
    'https://api.wallstreetcn.com/apiv1/content/lives?channel=global-channel&client=pc&limit=40',
    'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=40',
  ]
  for (const url of urls) {
    try {
      const payload = await readJson<{
        code?: number
        data?: { items?: Array<{ id: number; content_text?: string; content?: string; display_time?: number; title?: string }> }
      }>(url)
      const items = payload.data?.items ?? []
      const mapped = items
        .map((row) => {
          const title = (row.content_text || row.title || row.content || '').replace(/<[^>]+>/g, '').trim()
          return {
            id: `wscn-${row.id}`,
            title,
            date: formatNewsTime(row.display_time ?? Date.now()),
            type: 'news' as const,
            sentiment: inferSentiment(title),
            tag: extractTag(title, quotes),
            url: `https://wallstreetcn.com/live/${row.id}`,
            summary: title,
          }
        })
        .filter((item) => item.title)
      if (mapped.length > 0) return mapped
    } catch {
      /* try next */
    }
  }
  return []
}

/** 财联社电报：本地签名零 key。浏览器靠 Vite 代理，iOS 打包靠原生 HTTP。 */
async function fetchClsTelegraph(quotes: QuoteItem[]): Promise<AnnouncementItem[]> {
  if (!canBypassBrowserCors()) return []
  const params: Record<string, string> = {
    appName: 'CailianpressWeb',
    last_time: '',
    os: 'web',
    refresh_type: '1',
    rn: '20',
    sv: '7.7.5',
  }
  const qs = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  const sign = await md5OfSha1Hex(qs)
  const path = `/v1/roll/get_roll_list?${qs}&sign=${sign}`
  const urls: string[] = []
  if (usesDevProxy()) urls.push(`/cls${path}`)
  if (usesNativeHttp()) urls.push(`https://www.cls.cn${path}`)

  for (const url of urls) {
    try {
      const payload = await readJson<{
        errno?: number | string
        data?: {
          roll_data?: Array<{
            id?: number
            title?: string
            brief?: string
            content?: string
            ctime?: number
            shareurl?: string
            jumpUrl?: string
          }>
        }
      }>(url)
      if (String(payload.errno ?? '0') !== '0') continue
      const mapped = (payload.data?.roll_data ?? [])
        .map((row) => {
          const title = (row.title || row.brief || row.content || '').replace(/<[^>]+>/g, '').trim()
          return {
            id: `cls-${row.id ?? title.slice(0, 24)}`,
            title,
            date: formatNewsTime(row.ctime ?? Date.now()),
            type: 'news' as const,
            sentiment: inferSentiment(title),
            tag: extractTag(title, quotes),
            url: row.shareurl || row.jumpUrl || (row.id ? `https://www.cls.cn/detail/${row.id}` : undefined),
            summary: (row.brief || row.content || title).replace(/<[^>]+>/g, '').trim(),
          }
        })
        .filter((item) => item.title)
      if (mapped.length > 0) return mapped
    } catch {
      /* try next */
    }
  }
  return []
}

export async function fetchFlashNews(quotes: QuoteItem[] = []): Promise<AnnouncementItem[]> {
  try {
    const rows = await fetchKuaixunRaw()
    const mapped = mapKuaixun(rows, quotes)
    if (mapped.length > 0) return mapped
  } catch {
    /* next source */
  }

  const cls = await fetchClsTelegraph(quotes)
  if (cls.length > 0) return cls

  const wscn = await fetchWallstreetcnFlash(quotes)
  if (wscn.length > 0) return wscn

  return fetchSinaFlash()
}

interface F10Payload {
  gszx?: {
    data?: {
      items?: Array<{
        code?: string
        title?: string
        showDateTime?: number
        uniqueUrl?: string
        url?: string
        summary?: string
      }>
    }
  }
  gsgg?: Array<{ art_code?: string; title?: string; notice_date?: string; display_time?: string }>
}

export async function fetchStockNews(stock: QuoteItem): Promise<AnnouncementItem[]> {
  if (stock.market === 'futures') return []
  const listed = formatListedCode(stock.code, stock.market)
  const path = `/PC_HSF10/NewsBulletin/PageAjax?code=${encodeURIComponent(listed)}`
  const urls = usesDevProxy()
    ? [`/em-f10${path}`, `https://emweb.securities.eastmoney.com${path}`]
    : [`https://emweb.securities.eastmoney.com${path}`]

  for (const url of urls) {
    try {
      const payload = await readJson<F10Payload>(url)
      const news = (payload.gszx?.data?.items ?? []).map((item) => ({
        id: item.code || item.uniqueUrl || item.title || crypto.randomUUID(),
        title: item.title ?? '',
        date: item.showDateTime
          ? new Date(item.showDateTime).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '',
        type: 'news' as const,
        sentiment: inferSentiment(item.title ?? ''),
        tag: stock.name,
        url: item.uniqueUrl || item.url,
        summary: item.summary || item.title,
      }))
      const notices = (payload.gsgg ?? []).map((item) => ({
        id: item.art_code || item.title || crypto.randomUUID(),
        title: item.title ?? '',
        date: (item.notice_date || item.display_time || '').slice(0, 16),
        type: 'announcement' as const,
        sentiment: inferSentiment(item.title ?? ''),
        tag: stock.name,
        summary: item.title,
      }))
      if (news.length + notices.length > 0) return [...notices, ...news]
    } catch {
      /* try next */
    }
  }
  return []
}

export async function fetchWatchlistNews(quotes: QuoteItem[]): Promise<AnnouncementItem[]> {
  const targets = (quotes.filter((q) => q.isWatchlisted).length
    ? quotes.filter((q) => q.isWatchlisted)
    : quotes
  ).slice(0, 4)

  const batches = await Promise.all(targets.map((q) => fetchStockNews(q).catch(() => [] as AnnouncementItem[])))
  const fromF10 = batches.flat().filter((item) => item.type === 'news' && item.title).slice(0, 8)
  if (fromF10.length > 0) return fromF10

  const flash = await fetchFlashNews(quotes)
  const names = quotes.map((q) => q.name)
  const matched = flash.filter((item) => names.some((name) => item.title.includes(name) || item.tag === name))
  return (matched.length > 0 ? matched : flash).slice(0, 8)
}
