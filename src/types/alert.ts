export type AlertDirection = 'above' | 'below'
export type AlertRuleType = 'price' | 'percent'

export interface AlertRule {
  id: string
  stockCode: string
  stockName: string
  ruleType: AlertRuleType
  targetPrice: number
  /** Percent threshold, e.g. 5 means ±5% */
  targetPercent?: number
  direction: AlertDirection
  isActive: boolean
  createdAt: string
}

export type BarkLevel = 'active' | 'timeSensitive' | 'passive' | 'critical'

export interface BarkSettings {
  enabled: boolean
  key: string
  level: BarkLevel
  persistentRing: boolean
}

export interface DesktopAlertSettings {
  systemBanner: boolean
  alarmSound: boolean
  ttsVoice: boolean
  popupAlert: boolean
}

export type ShareViewStatus = 'idle' | 'generating' | 'ready' | 'copied' | 'error'

export interface ShareViewStub {
  status: ShareViewStatus
  shareUrl: string | null
  expiresAt: string | null
  isReadOnly: boolean
}
