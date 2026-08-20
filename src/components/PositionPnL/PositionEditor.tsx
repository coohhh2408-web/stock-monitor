import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal, Button } from '@/components/ui/Modal'
import { parseCostPrice, parseShareCount } from '@/lib/amountInput'
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
  onSubmit: (draft: PositionDraft) => boolean
}

const fieldClass =
  'w-full px-3 py-2.5 rounded-xl bg-white border border-black/[0.08] text-[17px] font-mono tabular focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20'

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
    const first = quotes.find((q) => !existingCodes.includes(q.code))
    setCode(first?.code ?? '')
    setShares('100')
    const price = first ? String(first.price) : ''
    setOriginalCost(price)
    setActualCost(price)
    // 只在打开弹窗时灌一次。行情 5 秒一刷会换 quotes 引用，不能跟着重置，否则股数填了又被冲掉。
  }, [isOpen, editing])

  const quote = quotes.find((q) => q.code === code) ?? selectable[0]
  const shareCount = parseShareCount(shares)
  const cost = parseCostPrice(originalCost)
  const actual = parseCostPrice(actualCost)
  const valid = Boolean(quote && shareCount && cost)

  const fillFromPrice = () => {
    if (!quote) return
    const price = String(quote.price)
    setOriginalCost(price)
    setActualCost((prev) => prev || price)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!quote || !shareCount || !cost) return
    const ok = onSubmit({
      code: quote.code,
      shares: shareCount,
      originalCost: cost,
      actualCost: actual ?? cost,
    })
    if (ok) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `编辑持仓 · ${editing.name}` : '添加持仓'}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" form="position-editor-form" disabled={!valid}>
            {editing ? '保存' : '添加'}
          </Button>
        </>
      }
    >
      <form id="position-editor-form" className="space-y-3" onSubmit={handleSubmit}>
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
                const nextCode = e.target.value
                setCode(nextCode)
                const next = quotes.find((q) => q.code === nextCode)
                if (next) {
                  setOriginalCost(String(next.price))
                  setActualCost(String(next.price))
                }
              }}
              className={fieldClass}
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="next"
              autoComplete="off"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              className={fieldClass}
            />
            <span className="block text-[11px] text-neutral-400">A 股通常 100 股为一手</span>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-neutral-400">原始成本</span>
            <input
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              value={originalCost}
              onChange={(e) => setOriginalCost(e.target.value)}
              placeholder={quote ? String(quote.price) : ''}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-neutral-400">实际成本（做过 T 可改，默认等于原始成本）</span>
            <input
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="可留空，回车即添加"
              className={fieldClass}
            />
          </label>
        </div>

        {!valid && selectable.length > 0 && (
          <p className="text-[12px] text-neutral-400">股数和原始成本都要大于 0，才能添加。</p>
        )}
      </form>
    </Modal>
  )
}
