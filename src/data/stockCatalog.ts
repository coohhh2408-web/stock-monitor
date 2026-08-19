import type { QuoteItem, StockCatalogEntry } from '@/types/market'

/** 可搜索的股票目录（模拟行情数据源，后续可接真实 API） */
export const STOCK_CATALOG: StockCatalogEntry[] = [
  { name: '鹏鼎控股', code: '002938', market: 'a-share', basePrice: 38.52 },
  { name: '立讯精密', code: '002475', market: 'a-share', basePrice: 32.18 },
  { name: '工业富联', code: '601138', market: 'a-share', basePrice: 24.65 },
  { name: '歌尔股份', code: '002241', market: 'a-share', basePrice: 22.40 },
  { name: '蓝思科技', code: '300433', market: 'a-share', basePrice: 18.75 },
  { name: '中际旭创', code: '300308', market: 'a-share', basePrice: 128.50 },
  { name: '寒武纪', code: '688256', market: 'a-share', basePrice: 245.00 },
  { name: '海康威视', code: '002415', market: 'a-share', basePrice: 28.90 },
  { name: '招商银行', code: '600036', market: 'a-share', basePrice: 35.20 },
  { name: '中国平安', code: '601318', market: 'a-share', basePrice: 48.60 },
  { name: '隆基绿能', code: '601012', market: 'a-share', basePrice: 16.80 },
  { name: '五粮液', code: '000858', market: 'a-share', basePrice: 128.00 },
  { name: '泸州老窖', code: '000568', market: 'a-share', basePrice: 142.50 },
  { name: '美团-W', code: '03690', market: 'hk-stock', basePrice: 118.00 },
  { name: '腾讯控股', code: '00700', market: 'hk-stock', basePrice: 368.00 },
  { name: '贵州茅台', code: '600519', market: 'a-share', basePrice: 1688.50, aliases: ['茅台'] },
  { name: '宁德时代', code: '300750', market: 'a-share', basePrice: 198.32 },
  { name: '比亚迪', code: '002594', market: 'a-share', basePrice: 285.60 },
  { name: '苹果', code: 'AAPL', market: 'us-stock', basePrice: 228.45, aliases: ['apple', 'apple inc.', '苹果公司'] },
  { name: '特斯拉', code: 'TSLA', market: 'us-stock', basePrice: 352.80, aliases: ['tesla'] },
  { name: '微软', code: 'MSFT', market: 'us-stock', basePrice: 415.20, aliases: ['microsoft'] },
  { name: '英伟达', code: 'NVDA', market: 'us-stock', basePrice: 875.50, aliases: ['nvidia', 'nvda'] },
  { name: '亚马逊', code: 'AMZN', market: 'us-stock', basePrice: 185.30, aliases: ['amazon'] },
  { name: 'Meta', code: 'META', market: 'us-stock', basePrice: 512.80, aliases: ['facebook', '脸书'] },
  { name: '洛阳钼业', code: '603993', market: 'a-share', basePrice: 8.62 },
  { name: '沪深300主连', code: 'IF2503', market: 'futures', basePrice: 3856.2, aliases: ['沪深300', 'if'] },
  { name: '中证500主连', code: 'IC2503', market: 'futures', basePrice: 5420.0 },
]

export function searchStockCatalog(
  query: string,
  existingCodes: string[],
  limit = 8,
): StockCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return STOCK_CATALOG.filter((s) => {
    if (existingCodes.includes(s.code)) return false
    const aliases = (s.aliases ?? []).join(' ').toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      aliases.includes(q)
    )
  }).slice(0, limit)
}

export function catalogEntryToQuote(entry: StockCatalogEntry): QuoteItem {
  const jitter = (Math.random() - 0.5) * entry.basePrice * 0.008
  const price = Math.round((entry.basePrice + jitter) * 100) / 100
  const change = Math.round((price * (Math.random() * 0.02 - 0.005)) * 100) / 100
  const open = Math.round((price - change) * 100) / 100
  const changePercent = open !== 0 ? Math.round((change / open) * 10000) / 100 : 0

  return {
    id: crypto.randomUUID(),
    name: entry.name,
    code: entry.code,
    market: entry.market,
    price,
    change,
    changePercent,
    open,
    high: Math.round(Math.max(price, open) * 1.008 * 100) / 100,
    low: Math.round(Math.min(price, open) * 0.992 * 100) / 100,
    isWatchlisted: true,
    secid: entry.secid,
  }
}
