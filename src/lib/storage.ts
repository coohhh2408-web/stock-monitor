const PREFIX = 'stock-monitor:'

export function loadOptionalFromStorage<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null || raw === '') return undefined
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  const value = loadOptionalFromStorage<T>(key)
  return value === undefined ? fallback : value
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // quota exceeded — silently ignore
  }
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

export const STORAGE_KEYS = {
  quotes: 'quotes',
  positions: 'positions',
  tTrades: 't-trades',
  alerts: 'alerts',
  bark: 'bark-settings',
  desktop: 'desktop-settings',
  appSettings: 'app-settings',
  shareViews: 'share-views',
  aiCache: 'ai-diagnosis-cache',
  cloudSync: 'cloud-sync',
  notifiedAlerts: 'notified-alerts',
} as const
