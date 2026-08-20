import type { AlertRule, BarkSettings, DesktopAlertSettings } from '@/types/alert'
import type { QuoteItem } from '@/types/market'
import type { PositionItem, TTradeRecord } from '@/types/position'
import type { AppSettings } from '@/types/settings'
import type { PricePlan } from '@/types/pricePlan'

export type CloudSyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export interface CloudSyncState {
  enabled: boolean
  roomId: string | null
  /** Stored locally only — never uploaded in plain text */
  pin: string
  lastSyncedAt: string | null
  lastRemoteUpdatedAt: string | null
  status: CloudSyncStatus
  error: string | null
}

export const DEFAULT_CLOUD_SYNC: CloudSyncState = {
  enabled: false,
  roomId: null,
  pin: '',
  lastSyncedAt: null,
  lastRemoteUpdatedAt: null,
  status: 'offline',
  error: null,
}

export interface SyncPayload {
  version: 1
  updatedAt: string
  quotes: QuoteItem[]
  positions: PositionItem[]
  tTrades: TTradeRecord[]
  alerts: AlertRule[]
  bark: BarkSettings
  desktop: DesktopAlertSettings
  settings: AppSettings
  pricePlans?: Record<string, PricePlan>
}

export type SyncPayloadInput = Omit<SyncPayload, 'version' | 'updatedAt'>
