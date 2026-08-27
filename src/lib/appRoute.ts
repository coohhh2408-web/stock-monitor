import type { AppTab } from '@/types/features'

/** 无代码时打开这只：目录和默认看板都有，圆桌能立刻出三人短评。 */
export const DEFAULT_RESEARCH_CODE = '600519'

export interface AppRoute {
  tab: AppTab
  research: boolean
  code: string | null
  demoPush: boolean
}

export function normalizeStockCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^[A-Za-z]/.test(trimmed)) return trimmed.toUpperCase()
  return trimmed
}

function tabFromHash(raw: string): AppTab | null {
  if (raw === 'alert' || raw === 'position' || raw === 'market' || raw === 'screener') return raw
  return null
}

/**
 * 手机圆桌入口，和 `#push` 同一套：
 * - `#research` / `?open=research` → 三人短评
 * - `#research/600519` / `?open=research&code=600519` → 指定标的
 */
export function parseAppRoute(search = '', hash = ''): AppRoute {
  const query = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(query)
  const open = (params.get('open') ?? '').trim().toLowerCase()
  const queryCode = normalizeStockCode(params.get('code'))

  const raw = hash.replace(/^#\/?/, '').split('?')[0] ?? ''
  const demoPush = raw === 'push' || raw === 'demo-alert' || params.get('push') === '1'

  const researchFromHash = raw === 'research' || raw.startsWith('research/')
  if (open === 'research' || researchFromHash) {
    const fromHash = raw.match(/^research\/([^/?#]+)/)?.[1]
    return {
      tab: 'screener',
      research: true,
      code: queryCode || normalizeStockCode(fromHash),
      demoPush: false,
    }
  }

  if (demoPush) {
    return { tab: 'alert', research: false, code: null, demoPush: true }
  }

  return {
    tab: tabFromHash(raw) ?? 'market',
    research: false,
    code: null,
    demoPush: false,
  }
}

export function researchHash(code?: string | null): string {
  const normalized = normalizeStockCode(code)
  return normalized ? `#research/${normalized}` : '#research'
}
