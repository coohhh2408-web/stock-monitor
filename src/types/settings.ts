export interface AppSettings {
  priceTickerEnabled: boolean
  tickerIntervalMs: number
  liveQuotesEnabled: boolean
  lastSavedAt: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  priceTickerEnabled: true,
  tickerIntervalMs: 5000,
  liveQuotesEnabled: true,
  lastSavedAt: null,
}
