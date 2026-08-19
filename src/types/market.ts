export type MarketCategory = 'all' | 'a-share' | 'hk-stock' | 'us-stock' | 'futures' | 'watchlist'

export type SentimentTag = 'bullish' | 'bearish' | 'neutral'

export interface QuoteItem {
  id: string
  name: string
  code: string
  market: Exclude<MarketCategory, 'all' | 'watchlist'>
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume?: number
  amount?: number
  turnover?: number
  pe?: number
  peTtm?: number
  pb?: number
  marketCap?: number
  circMarketCap?: number
  amplitude?: number
  volumeRatio?: number
  limitUp?: number
  limitDown?: number
  industry?: string
  isWatchlisted?: boolean
  prevClose?: number
  updatedAt?: string
  secid?: string
}

export type ChartPeriod = 'intraday' | '5d' | 'day' | 'week' | 'month'

export interface KlineBar {
  time: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  amount?: number
  changePercent?: number
}

export interface SparklineDataPoint {
  time: string
  price: number
}

export type AIDiagnosisStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AIDiagnosisStub {
  status: AIDiagnosisStatus
  moatAnalysis?: string
  roeDuPont?: string
  anomalySummary?: string
}

export interface AnnouncementItem {
  id: string
  title: string
  date: string
  type: 'announcement' | 'news'
  sentiment?: SentimentTag
  tag?: string
  url?: string
  summary?: string
}

export interface StockDetailDrawerState {
  isOpen: boolean
  stock: QuoteItem | null
  sparkline: SparklineDataPoint[]
  aiDiagnosis: AIDiagnosisStub
  announcements: AnnouncementItem[]
  activeTab: 'f10' | 'news24h'
}

export interface StockCatalogEntry {
  name: string
  code: string
  market: Exclude<MarketCategory, 'all' | 'watchlist'>
  basePrice: number
  secid?: string
  aliases?: string[]
}

export interface MarketFilterState {
  category: MarketCategory
  searchQuery: string
}
