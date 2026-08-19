const PREFIX = 'stock-monitor:'

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
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
} as const
