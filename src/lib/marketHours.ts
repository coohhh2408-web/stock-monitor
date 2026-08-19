import type { QuoteItem } from '@/types/market'

function clockInZone(timeZone: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return {
    weekday: weekdayMap[map.weekday] ?? 0,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  }
}

function inRange(minutes: number, start: number, end: number): boolean {
  return minutes >= start && minutes <= end
}

export function isAShareSessionOpen(): boolean {
  const { weekday, minutes } = clockInZone('Asia/Shanghai')
  if (weekday === 0 || weekday === 6) return false
  return inRange(minutes, 9 * 60 + 15, 11 * 60 + 30) || inRange(minutes, 13 * 60, 15 * 60)
}

export function isUsSessionOpen(): boolean {
  const { weekday, minutes } = clockInZone('America/New_York')
  if (weekday === 0 || weekday === 6) return false
  return inRange(minutes, 9 * 60 + 30, 16 * 60)
}

export function isHkSessionOpen(): boolean {
  const { weekday, minutes } = clockInZone('Asia/Shanghai')
  if (weekday === 0 || weekday === 6) return false
  return inRange(minutes, 9 * 60 + 30, 12 * 60) || inRange(minutes, 13 * 60, 16 * 60)
}

export function anyWatchedMarketOpen(quotes: QuoteItem[]): boolean {
  const markets = new Set(quotes.map((q) => q.market))
  if (markets.has('a-share') && isAShareSessionOpen()) return true
  if (markets.has('hk-stock') && isHkSessionOpen()) return true
  if ((markets.has('us-stock') || markets.has('futures')) && (isUsSessionOpen() || isAShareSessionOpen())) {
    return true
  }
  if (markets.size === 0) return isAShareSessionOpen() || isUsSessionOpen()
  return false
}

export function sessionLabel(quotes: QuoteItem[]): string {
  if (anyWatchedMarketOpen(quotes)) return '交易中'
  return '已收盘'
}

export function recommendedPollMs(quotes: QuoteItem[], preferredMs: number): number {
  const min = 3000
  const preferred = Math.max(min, preferredMs)
  if (anyWatchedMarketOpen(quotes)) return preferred
  return Math.max(preferred, 20000)
}
