import type { QuoteItem } from '@/types/market'
import type { PositionItem, PortfolioSummary, TTradeRecord } from '@/types/position'
import type { AlertRule } from '@/types/alert'

export const MOCK_QUOTES: QuoteItem[] = [
  { id: '1', name: '鹏鼎控股', code: '002938', market: 'a-share', price: 94.77, change: -3.73, changePercent: -3.79, open: 98.43, high: 98.43, low: 93.00, isWatchlisted: true },
  { id: '2', name: '洛阳钼业', code: '603993', market: 'a-share', price: 8.62, change: -0.14, changePercent: -1.62, open: 8.75, high: 8.80, low: 8.55 },
  { id: '3', name: '贵州茅台', code: '600519', market: 'a-share', price: 1688.50, change: 23.40, changePercent: 1.41, open: 1665.00, high: 1695.00, low: 1660.00, isWatchlisted: true },
  { id: '4', name: '英伟达', code: 'NVDA', market: 'us-stock', price: 182.40, change: 2.15, changePercent: 1.19, open: 180.10, high: 183.50, low: 179.80, isWatchlisted: true },
  { id: '5', name: '北方稀土', code: '600111', market: 'a-share', price: 22.18, change: -0.32, changePercent: -1.42, open: 22.50, high: 22.62, low: 22.05 },
  { id: '6', name: '宁德时代', code: '300750', market: 'a-share', price: 198.32, change: -3.18, changePercent: -1.58, open: 201.50, high: 202.00, low: 197.80 },
]

export const MOCK_POSITIONS: PositionItem[] = [
  {
    id: 'p1', name: '贵州茅台', code: '600519', currentPrice: 1688.50,
    originalCost: 1750.00, actualCost: 1712.30, tTradeSaved: 37.70,
    shares: 200, marketValue: 337700, dailyPnL: 4680, totalPnL: -7540,
    strategyStatus: 'trigger-zone',
  },
  {
    id: 'p2', name: '宁德时代', code: '300750', currentPrice: 198.32,
    originalCost: 210.00, actualCost: 205.80, tTradeSaved: 4.20,
    shares: 500, marketValue: 99160, dailyPnL: -1590, totalPnL: -3740,
    strategyStatus: 'watching',
  },
  {
    id: 'p3', name: '英伟达', code: 'NVDA', currentPrice: 182.40,
    originalCost: 150.00, actualCost: 150.00, tTradeSaved: 0,
    shares: 50, marketValue: 9120, dailyPnL: 107.5, totalPnL: 1620,
    strategyStatus: 'insufficient-space',
  },
]

export const MOCK_SUMMARY: PortfolioSummary = {
  totalMarketValue: 459705,
  totalCost: 472785,
  totalPnL: -6935,
  dailyPnL: 3305,
  tTradeSavedTotal: 9640,
}

export const MOCK_T_TRADES: TTradeRecord[] = [
  { id: 't1', positionId: 'p1', direction: 'sell', price: 1720.00, shares: 100, fee: 5.16, timestamp: '2026-08-15 10:32', newCostPrice: 1712.30, releasedProfit: 768.84 },
  { id: 't2', positionId: 'p1', direction: 'buy', price: 1695.00, shares: 100, fee: 5.09, timestamp: '2026-08-14 14:18', newCostPrice: 1735.05, releasedProfit: 0 },
  { id: 't3', positionId: 'p2', direction: 'sell', price: 208.50, shares: 200, fee: 5.00, timestamp: '2026-08-13 09:45', newCostPrice: 205.80, releasedProfit: 495.00 },
]

export const MOCK_ALERTS: AlertRule[] = [
  { id: 'a1', stockCode: '600519', stockName: '贵州茅台', ruleType: 'price', targetPrice: 1700, direction: 'above', isActive: true, createdAt: '2026-08-10' },
  { id: 'a2', stockCode: '600519', stockName: '贵州茅台', ruleType: 'price', targetPrice: 1650, direction: 'below', isActive: true, createdAt: '2026-08-10' },
  { id: 'a3', stockCode: '300750', stockName: '宁德时代', ruleType: 'price', targetPrice: 195, direction: 'below', isActive: true, createdAt: '2026-08-12' },
  { id: 'a4', stockCode: 'NVDA', stockName: '英伟达', ruleType: 'price', targetPrice: 200, direction: 'above', isActive: false, createdAt: '2026-08-08' },
  { id: 'a5', stockCode: '002938', stockName: '鹏鼎控股', ruleType: 'percent', targetPrice: 0, targetPercent: 5, direction: 'below', isActive: true, createdAt: '2026-08-14' },
  { id: 'a6', stockCode: '002938', stockName: '鹏鼎控股', ruleType: 'percent', targetPrice: 0, targetPercent: 3, direction: 'above', isActive: true, createdAt: '2026-08-14' },
]

export const MOCK_SPARKLINE = Array.from({ length: 30 }, (_, i) => ({
  time: `${9 + Math.floor(i / 6)}:${String((i % 6) * 10).padStart(2, '0')}`,
  price: 1660 + Math.sin(i * 0.4) * 20 + i * 0.8,
}))

export const MOCK_ANNOUNCEMENTS = [
  { id: 'n1', title: '关于2026年半年度利润分配预案的公告', date: '2026-08-16', type: 'announcement' as const, sentiment: 'bullish' as const },
  { id: 'n2', title: '北向资金今日净买入超50亿元，白酒板块领涨', date: '2026-08-16 14:30', type: 'news' as const, sentiment: 'bullish' as const },
  { id: 'n3', title: '公司控股股东暂无减持计划', date: '2026-08-15', type: 'announcement' as const, sentiment: 'neutral' as const },
]
