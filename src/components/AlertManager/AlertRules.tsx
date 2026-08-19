import { useMemo, useState } from 'react'
import { cn, formatListedCode, formatPrice, formatQuotePrice } from '@/lib/utils'
import { formatAlertLabel, normalizeAlertRule } from '@/lib/alertUtils'
import type { AlertRule, AlertDirection, AlertRuleType } from '@/types/alert'
import type { QuoteItem } from '@/types/market'

interface AlertRulesProps {
  quotes: QuoteItem[]
  rules: AlertRule[]
  onEdit: (rule: AlertRule) => void
  onDelete: (ruleId: string) => void
  onAdd: (partial: Omit<AlertRule, 'id' | 'createdAt'>) => Promise<void>
  onToggle: (ruleId: string) => void
}

function RulePill({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: AlertRule
  onEdit: (rule: AlertRule) => void
  onDelete: (ruleId: string) => void
  onToggle: (ruleId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const normalized = normalizeAlertRule(rule)
  const isAbove = normalized.direction === 'above'

  const confirmEdit = () => {
    if (normalized.ruleType === 'percent') {
      const pct = parseFloat(editValue)
      if (!isNaN(pct) && pct > 0) {
        onEdit({ ...normalized, targetPercent: pct })
      }
    } else {
      const price = parseFloat(editValue)
      if (!isNaN(price) && price > 0) onEdit({ ...normalized, targetPrice: price })
    }
    setEditing(false)
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => onToggle(rule.id)}
      onKeyDown={(e) => e.key === 'Enter' && onToggle(rule.id)}
      className={cn(
        'group inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs font-medium cursor-pointer select-none',
        rule.isActive
          ? isAbove
            ? 'bg-red-50 text-red-600 border border-red-200/60'
            : 'bg-green-50 text-green-700 border border-green-200/60'
          : 'bg-neutral-100 text-neutral-400 border border-transparent opacity-60',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isAbove ? 'bg-[#FF3B30]' : 'bg-[#34C759]')} />
      {editing ? (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={confirmEdit}
          onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
          onClick={(e) => e.stopPropagation()}
          className="w-14 bg-white rounded px-1 py-0 text-xs font-mono tabular border border-neutral-200 focus:outline-none"
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation()
            setEditing(true)
            setEditValue(
              normalized.ruleType === 'percent'
                ? String(normalized.targetPercent ?? '')
                : String(normalized.targetPrice),
            )
          }}
          className="font-mono tabular font-semibold"
        >
          {formatAlertLabel(normalized)}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(rule.id)
        }}
        className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors rounded-full hover:bg-white/80"
      >
        ×
      </button>
    </span>
  )
}

function StockAlertCard({
  quote,
  rules,
  onEdit,
  onDelete,
  onAdd,
  onToggle,
}: {
  quote: QuoteItem
  rules: AlertRule[]
  onEdit: (rule: AlertRule) => void
  onDelete: (ruleId: string) => void
  onAdd: (partial: Omit<AlertRule, 'id' | 'createdAt'>) => Promise<void>
  onToggle: (ruleId: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [price, setPrice] = useState('')
  const [dir, setDir] = useState<AlertDirection>('below')
  const [ruleType, setRuleType] = useState<AlertRuleType>('price')

  const isUp = quote.change >= 0
  const sign = isUp ? '+' : ''

  const submitRule = async () => {
    if (ruleType === 'percent') {
      const pct = parseFloat(price)
      if (!isNaN(pct) && pct > 0) {
        await onAdd({
          stockCode: quote.code,
          stockName: quote.name,
          ruleType: 'percent',
          targetPrice: 0,
          targetPercent: pct,
          direction: dir,
          isActive: true,
        })
        setPrice('')
        setAdding(false)
      }
      return
    }
    const p = parseFloat(price)
    if (!isNaN(p) && p > 0) {
      await onAdd({
        stockCode: quote.code,
        stockName: quote.name,
        ruleType: 'price',
        targetPrice: p,
        direction: dir,
        isActive: true,
      })
      setPrice('')
      setAdding(false)
    }
  }

  const quickPercent = async (pct: number, direction: AlertDirection) => {
    await onAdd({
      stockCode: quote.code,
      stockName: quote.name,
      ruleType: 'percent',
      targetPrice: 0,
      targetPercent: pct,
      direction,
      isActive: true,
    })
  }

  return (
    <div className="quote-card !cursor-default">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 min-w-0 truncate">
          {quote.name}{' '}
          <span className="font-mono tabular text-neutral-400 font-medium">{formatListedCode(quote.code, quote.market)}</span>
        </h3>
        <p className="text-sm font-semibold font-mono tabular shrink-0">
          <span className="text-neutral-900">{formatQuotePrice(quote.price, quote.market)}</span>
          {' '}
          <span className={cn(isUp ? 'text-[#FF3B30]' : 'text-[#34C759]')}>
            {sign}{quote.changePercent.toFixed(2)}%
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[22px]">
        {rules.length === 0 && !adding && (
          <p className="text-[11px] text-neutral-400">暂无规则，点下方按钮添加</p>
        )}
        {rules.map((rule) => (
          <RulePill key={rule.id} rule={rule} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
        ))}
      </div>

      {!adding ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-[#007AFF] font-medium bg-[#007AFF]/10 hover:bg-[#007AFF]/15 px-3 py-1 rounded-full transition-colors"
          >
            + 添加规则
          </button>
          <button
            onClick={() => quickPercent(3, 'above')}
            className="text-[10px] text-[#FF3B30] bg-red-50 px-2 py-0.5 rounded-full border border-red-200/50"
          >
            涨幅 3%
          </button>
          <button
            onClick={() => quickPercent(5, 'below')}
            className="text-[10px] text-[#34C759] bg-green-50 px-2 py-0.5 rounded-full border border-green-200/50"
          >
            跌幅 5%
          </button>
        </div>
      ) : (
        <div className="mb-3 space-y-2 p-3 rounded-xl bg-neutral-50/80">
          <div className="flex gap-1 p-0.5 bg-neutral-200/60 rounded-lg">
            {(['price', 'percent'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRuleType(t)}
                className={cn(
                  'flex-1 py-1 rounded-md text-xs font-medium transition-colors',
                  ruleType === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500',
                )}
              >
                {t === 'price' ? '价格' : '涨跌幅'}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={
              ruleType === 'percent'
                ? '百分比，如 5'
                : `目标价（当前 ${formatPrice(quote.price)}）`
            }
            className="w-full px-3 py-1.5 rounded-lg bg-white text-sm font-mono tabular border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
          />
          <div className="flex gap-2">
            {(['below', 'above'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDir(d)}
                className={cn(
                  'flex-1 py-1 rounded-lg text-xs font-medium',
                  dir === d ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400',
                )}
              >
                {ruleType === 'percent'
                  ? d === 'above' ? '涨幅 ≥' : '跌幅 ≥'
                  : d === 'above' ? '涨破 ≥' : '跌破 ≤'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="text-xs text-neutral-500 px-2 py-1">取消</button>
            <button onClick={() => void submitRule()} className="text-xs bg-[#007AFF] text-white px-3 py-1 rounded-lg font-medium">确认</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AlertRules({ quotes, rules, onEdit, onDelete, onAdd, onToggle }: AlertRulesProps) {
  const stocksWithRules = useMemo(() => {
    return quotes.map((quote) => ({
      quote,
      rules: rules.filter((r) => r.stockCode === quote.code),
    }))
  }, [quotes, rules])

  if (stocksWithRules.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400 text-sm">
        暂无看板标的，请先在行情页添加股票
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {stocksWithRules.map(({ quote, rules: stockRules }) => (
        <StockAlertCard
          key={quote.code}
          quote={quote}
          rules={stockRules}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={onAdd}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
