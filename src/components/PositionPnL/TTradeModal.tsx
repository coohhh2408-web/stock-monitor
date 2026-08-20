import { useState, useMemo, useEffect } from 'react'
import { Modal, Button } from '@/components/ui/Modal'
import { cn, formatPrice, formatCurrency, getChangeColor, calculateTTrade } from '@/lib/utils'
import type { PositionItem, TTradeFormInput, TTradeCalculationResult } from '@/types/position'

interface TTradeModalProps {
  isOpen: boolean
  position: PositionItem | null
  onClose: () => void
  onSubmit: (form: TTradeFormInput, result: TTradeCalculationResult) => void
}

const DEFAULT_FORM: TTradeFormInput = {
  direction: 'sell',
  price: 0,
  shares: 100,
  fee: 5,
}

export function TTradeModal({ isOpen, position, onClose, onSubmit }: TTradeModalProps) {
  const [form, setForm] = useState<TTradeFormInput>(DEFAULT_FORM)

  useEffect(() => {
    if (position && isOpen) {
      setForm({ ...DEFAULT_FORM, price: position.currentPrice, shares: Math.min(100, position.shares) })
    }
  }, [position, isOpen])

  const calculation = useMemo(() => {
    if (!position || form.price <= 0 || form.shares <= 0) return null
    if (form.direction === 'sell' && form.shares > position.shares) return null
    return calculateTTrade(
      position.shares,
      position.actualCost,
      form.direction,
      form.price,
      form.shares,
      form.fee,
    )
  }, [position, form])

  const handleSubmit = () => {
    if (calculation) {
      onSubmit(form, calculation)
      onClose()
      setForm(DEFAULT_FORM)
    }
  }

  if (!position) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`记做T · ${position.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={!calculation}>确认记录</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-4 text-xs text-apple-gray-500 px-1">
          <span>现价 <span className="tabular text-apple-gray-800 font-medium">{formatPrice(position.currentPrice)}</span></span>
          <span>成本 <span className="tabular text-apple-gray-800 font-medium">{formatPrice(position.actualCost)}</span></span>
          <span>持仓 <span className="tabular text-apple-gray-800 font-medium">{position.shares}股</span></span>
        </div>

        <div className="flex gap-2">
          {(['sell', 'buy'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setForm((f) => ({ ...f, direction: dir }))}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                form.direction === dir
                  ? dir === 'sell' ? 'bg-apple-green/10 text-apple-green' : 'bg-apple-red/10 text-apple-red'
                  : 'bg-apple-gray-100/60 text-apple-gray-500',
              )}
            >
              {dir === 'sell' ? '卖出做T' : '买入做T'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-apple-gray-500">{form.direction === 'sell' ? '卖出' : '买入'}价格</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={form.price || ''}
              onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm tabular focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-apple-gray-500">股数</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={form.shares || ''}
              onChange={(e) => setForm((f) => ({ ...f, shares: parseInt(e.target.value, 10) || 0 }))}
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm tabular focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
            />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-apple-gray-500">手续费</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={form.fee || ''}
              onChange={(e) => setForm((f) => ({ ...f, fee: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm tabular focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
            />
          </label>
        </div>

        {form.direction === 'sell' && form.shares > position.shares && (
          <p className="text-xs text-apple-red">卖出股数不能超过当前持仓 ({position.shares}股)</p>
        )}

        {calculation && (
          <div className="glass p-4 space-y-2">
            <h4 className="text-xs font-medium text-apple-gray-500">试算结果</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-apple-gray-500">新实际成本</span>
                <p className="font-semibold tabular text-apple-gray-900">{formatPrice(calculation.newCostPrice)}</p>
              </div>
              <div>
                <span className="text-apple-gray-500">已释放利润</span>
                <p className={cn('font-semibold tabular', getChangeColor(calculation.releasedProfit))}>
                  {formatCurrency(calculation.releasedProfit)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-apple-gray-500">做T 已拉低</span>
                <p className="font-semibold tabular text-apple-green">{formatPrice(calculation.savedAmount)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
