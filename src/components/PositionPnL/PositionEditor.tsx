import { useEffect, useMemo, useState } from 'react'
import { Modal, Button } from '@/components/ui/Modal'
import { formatPrice } from '@/lib/utils'
import type { PositionItem } from '@/types/position'
import type { QuoteItem } from '@/types/market'

export interface PositionDraft {
  code: string
  shares: number
  originalCost: number
  actualCost: number
}

interface PositionEditorProps {
  isOpen: boolean
  quotes: QuoteItem[]
  existingCodes: string[]
  editing: PositionItem | null
  onClose: () => void
  onSubmit: (draft: PositionDraft) => void
}

export function PositionEditor({
  isOpen,
  quotes,
  existingCodes,
  editing,
  onClose,
  onSubmit,
}: PositionEditorProps) {
  const selectable = useMemo(() => {
    if (editing) return quotes.filter((q) => q.code === editing.code)
    return quotes.filter((q) => !existingCodes.includes(q.code))
  }, [quotes, existingCodes, editing])

  const [code, setCode] = useState('')
  const [shares, setShares] = useState('')
  const [originalCost, setOriginalCost] = useState('')
  const [actualCost, setActualCost] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setCode(editing.code)
      setShares(String(editing.shares))
      setOriginalCost(String(editing.originalCost))
      setActualCost(String(editing.actualCost))
      return
    }
      setCode(selectable[0]?.code ?? '')
      setShares('100')
      const price = selectable[0] ? String(selectable[0].price) : ''
      setOriginalCost(price)
      setActualCost(price)
  }, [isOpen, editing, selectable])

  const quote = quotes.find((q) => q.code === code) ?? selectable[0]
  const shareCount = parseInt(shares, 10)
  const cost = parseFloat(originalCost)
  const actual = parseFloat(actualCost)
  const valid =
    !!quote &&
    Number.isFinite(shareCount) &&
    shareCount > 0 &&
    Number.isFinite(cost) &&
    cost > 0

  const fillFromPrice = () => {
    if (!quote) return
    const price = String(quote.price)
    setOriginalCost(price)
    if (!actualCost) setActualCost(price)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `编辑持仓 · ${editing.name}` : '添加持仓'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              if (!quote || !valid) return
              onSubmit({
                code: quote.code,
                shares: shareCount,
                originalCost: cost,
                actualCost: Number.isFinite(actual) && actual > 0 ? actual : cost,
              })
              onClose()
            }}
          >
            {editing ? '保存' : '添加'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {editing ? (
          <p className="text-sm text-neutral-500">
            {editing.name}
            <span className="font-mono tabular text-neutral-400 ml-2">{editing.code}</span>
          </p>
        ) : selectable.length === 0 ? (
          <p className="text-sm text-neutral-400">看板上的标的都已有持仓。请先在行情页加入新股票。</p>
        ) : (
          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">股票</span>
            <select
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                const next = quotes.find((q) => q.code === e.target.value)
                if (next && !originalCost) {
                  setOriginalCost(String(next.price))
                  setActualCost(String(next.price))
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-black/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            >
              {selectable.map((q) => (
                <option key={q.code} value={q.code}>
                  {q.name} · {q.code} · {formatPrice(q.price)}
                </option>
              ))}
            </select>
          </label>
        )}

        {quote && (
          <p className="text-xs text-neutral-400">
            现价 <span className="font-mono tabular text-neutral-700">{formatPrice(quote.price)}</span>
            <button type="button" onClick={fillFromPrice} className="ml-2 text-[#007AFF]">
              用现价填成本
            </button>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-neutral-400">持股数量</span>
            <input
              type="number"
              min={1}
              step={1}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-black/[0.06] text-sm font-mono tabular focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-neutral-400">原始成本</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={originalCost}
              onChange={(e) => setOriginalCost(e.target.value)}
              placeholder={quote ? String(quote.price) : ''}
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-black/[0.06] text-sm font-mono tabular focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-neutral-400">实际成本（做过 T 可改，默认等于原始成本）</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="可留空"
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-black/[0.06] text-sm font-mono tabular focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}
