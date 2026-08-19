import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatListedCode(code: string, market: string): string {
  const c = code.trim().toUpperCase()
  if (/^(SH|SZ|HK|US|BJ)\w+/.test(c)) return c
  if (market === 'us-stock') return `US${c}`
  if (market === 'hk-stock') return `HK${c.padStart(5, '0')}`
  if (market === 'futures') return c
  if (/^[69]/.test(c) || c.startsWith('688')) return `SH${c}`
  return `SZ${c}`
}

export function formatPrice(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

export function formatQuotePrice(value: number, market?: string): string {
  const n = formatPrice(value)
  if (market === 'us-stock') return `$${n}`
  return `¥${n}`
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatYuan(value: number, decimals = 2): string {
  const abs = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return value < 0 ? `-¥${abs}` : `¥${abs}`
}

export function formatCurrency(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}¥${Math.abs(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1e8) return `${(value / 1e8).toFixed(2)}亿`
  if (Math.abs(value) >= 1e4) return `${(value / 1e4).toFixed(2)}万`
  return value.toLocaleString('zh-CN')
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-apple-red'
  if (change < 0) return 'text-apple-green'
  return 'text-apple-gray-500'
}

export function getChangeBgColor(change: number): string {
  if (change > 0) return 'bg-apple-red/10 text-apple-red'
  if (change < 0) return 'bg-apple-green/10 text-apple-green'
  return 'bg-apple-gray-100 text-apple-gray-600'
}

export function calculateTTrade(
  currentShares: number,
  currentCost: number,
  direction: 'buy' | 'sell',
  price: number,
  shares: number,
  fee: number,
): { newCostPrice: number; releasedProfit: number; savedAmount: number } {
  if (direction === 'buy') {
    const totalCost = currentShares * currentCost + price * shares + fee
    const newShares = currentShares + shares
    const newCostPrice = newShares > 0 ? totalCost / newShares : currentCost
    return { newCostPrice, releasedProfit: 0, savedAmount: Math.max(0, currentCost - newCostPrice) * newShares }
  }

  const proceeds = price * shares - fee
  const remainingShares = currentShares - shares
  const releasedProfit = (price - currentCost) * shares - fee

  if (remainingShares <= 0) {
    return { newCostPrice: currentCost, releasedProfit, savedAmount: 0 }
  }

  const remainingCost = currentShares * currentCost - proceeds
  const newCostPrice = remainingCost / remainingShares
  return {
    newCostPrice,
    releasedProfit,
    savedAmount: Math.max(0, currentCost - newCostPrice) * remainingShares,
  }
}
