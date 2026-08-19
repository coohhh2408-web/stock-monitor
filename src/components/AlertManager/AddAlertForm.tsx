import { useState } from 'react'
import type { AlertRule, AlertDirection } from '@/types/alert'
import type { QuoteItem } from '@/types/market'

export function AddAlertForm({ quotes, onAdd }: { quotes: QuoteItem[]; onAdd: (a: Omit<AlertRule, 'id' | 'createdAt'>) => void }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState(quotes[0]?.code ?? '')
  const [price, setPrice] = useState('')
  const [dir, setDir] = useState<AlertDirection>('above')
  const selected = quotes.find((q) => q.code === code)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#007AFF] font-medium hover:opacity-70 transition-opacity"
      >
        + 添加提醒
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <select value={code} onChange={(e) => setCode(e.target.value)} className="px-3 py-2 rounded-lg bg-neutral-100 text-sm focus:outline-none">
          {quotes.map((q) => <option key={q.code} value={q.code}>{q.name}</option>)}
        </select>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={selected ? String(selected.price) : '目标价'}
          className="px-3 py-2 rounded-lg bg-neutral-100 text-sm font-mono tabular focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        {(['above', 'below'] as const).map((d) => (
          <button key={d} onClick={() => setDir(d)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${dir === d ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-400'}`}>
            {d === 'above' ? '涨破 ≥' : '跌破 ≤'}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-full font-medium">取消</button>
        <button
          onClick={() => {
            const p = parseFloat(price)
            if (selected && !isNaN(p) && p > 0) {
              onAdd({ stockCode: selected.code, stockName: selected.name, ruleType: 'price', targetPrice: p, direction: dir, isActive: true })
              setPrice(''); setOpen(false)
            }
          }}
          className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-full font-medium"
        >
          添加
        </button>
      </div>
    </div>
  )
}
