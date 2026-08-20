import type { QuoteItem, StockCatalogEntry } from '@/types/market'

const SKIP_KIND = /^(ZS|QZ|KJ)/i
const SKIP_PREFIX = /^(jj|nf|hf|ff|ct|cq)$/i

export function parseTencentHint(raw: string): StockCatalogEntry[] {
  if (!raw.trim()) return []
  const out: StockCatalogEntry[] = []
  const seen = new Set<string>()

  for (const chunk of raw.split('^')) {
    const [prefix, codeRaw, name, , kind = ''] = chunk.split('~')
    if (!prefix || !codeRaw || !name) continue
    if (SKIP_PREFIX.test(prefix) || SKIP_KIND.test(kind)) continue

    const mapped = mapTencentRow(prefix, codeRaw, name)
    if (!mapped) continue
    const key = `${mapped.market}:${mapped.code}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(mapped)
    if (out.length >= 8) break
  }
  return out
}

function mapTencentRow(prefix: string, codeRaw: string, name: string): StockCatalogEntry | null {
  const p = prefix.toLowerCase()
  if (p === 'us') {
    const code = codeRaw.replace(/\.[a-z0-9]+$/i, '').toUpperCase()
    if (!code) return null
    return { name, code, market: 'us-stock', basePrice: 0 }
  }
  if (p === 'hk') {
    const code = codeRaw.replace(/\D/g, '').padStart(5, '0')
    return { name, code, market: 'hk-stock', basePrice: 0 }
  }
  if (p === 'sh' || p === 'sz' || p === 'bj') {
    const code = codeRaw.replace(/\D/g, '')
    if (!/^\d{6}$/.test(code)) return null
    return { name, code, market: 'a-share', basePrice: 0 }
  }
  return null
}

export function parseSinaSuggest(raw: string): StockCatalogEntry[] {
  if (!raw.trim()) return []
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
          ? rawCode.replace(/\.[a-z0-9]+$/i, '').toUpperCase()
          : market === 'hk-stock'
            ? rawCode.replace(/\D/g, '').padStart(5, '0')
            : rawCode.replace(/\D/g, '') || rawCode
      return { name: displayName, code, market, basePrice: 0 }
    })
    .filter((row) => row.code && row.name)
}
