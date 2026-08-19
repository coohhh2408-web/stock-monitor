import type { AlertRule } from '@/types/alert'
import type { QuoteItem } from '@/types/market'
import { formatPrice } from '@/lib/utils'

export function normalizeAlertRule(rule: AlertRule): AlertRule {
  return {
    ...rule,
    ruleType: rule.ruleType ?? 'price',
  }
}

export function isAlertTriggered(rule: AlertRule, quote: QuoteItem): boolean {
  const normalized = normalizeAlertRule(rule)
  if (normalized.ruleType === 'percent') {
    const threshold = normalized.targetPercent ?? 0
    if (normalized.direction === 'above') return quote.changePercent >= threshold
    return quote.changePercent <= -threshold
  }
  if (normalized.direction === 'above') return quote.price >= normalized.targetPrice
  return quote.price <= normalized.targetPrice
}

export function formatAlertLabel(rule: AlertRule): string {
  const normalized = normalizeAlertRule(rule)
  if (normalized.ruleType === 'percent') {
    const pct = (normalized.targetPercent ?? 0).toFixed(2)
    return normalized.direction === 'above' ? `涨幅 ${pct}%` : `跌幅 ${pct}%`
  }
  const verb = normalized.direction === 'above' ? '涨破' : '跌破'
  return `${verb} ¥${formatPrice(normalized.targetPrice)}`
}

export function alertTriggerMessage(rule: AlertRule, quote: QuoteItem): string {
  const normalized = normalizeAlertRule(rule)
  if (normalized.ruleType === 'percent') {
    return `${quote.name} 涨跌幅 ${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%，已触发「${formatAlertLabel(normalized)}」`
  }
  return `${quote.name} 现价 ${formatPrice(quote.price)}，已触发「${formatAlertLabel(normalized)}」`
}
