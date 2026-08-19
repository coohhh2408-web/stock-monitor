export type TTradeStrategyStatus =
  | 'watching'
  | 'insufficient-space'
  | 'trigger-zone'

export type TTradeDirection = 'buy' | 'sell'

export interface PositionItem {
  id: string
  name: string
  code: string
  currentPrice: number
  originalCost: number
  actualCost: number
  tTradeSaved: number
  shares: number
  marketValue: number
  dailyPnL: number
  totalPnL: number
  strategyStatus: TTradeStrategyStatus
}

export interface PortfolioSummary {
  totalMarketValue: number
  totalCost: number
  totalPnL: number
  dailyPnL: number
  tTradeSavedTotal: number
}

export interface TTradeRecord {
  id: string
  positionId: string
  direction: TTradeDirection
  price: number
  shares: number
  fee: number
  timestamp: string
  newCostPrice: number
  releasedProfit: number
  note?: string
}

export interface TTradeFormInput {
  direction: TTradeDirection
  price: number
  shares: number
  fee: number
}

export interface TTradeCalculationResult {
  newCostPrice: number
  releasedProfit: number
  savedAmount: number
}

export interface TTradeModalState {
  isOpen: boolean
  position: PositionItem | null
  form: TTradeFormInput
  calculation: TTradeCalculationResult | null
  isCalculating: boolean
}

export interface TTradeTimelineState {
  isExpanded: boolean
  records: TTradeRecord[]
  isLoading: boolean
}
