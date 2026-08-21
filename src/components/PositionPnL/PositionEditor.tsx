import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal, Button } from '@/components/ui/Modal'
import { useStockSearch } from '@/hooks/useStockSearch'
import { parseCostPrice, parseShareCount } from '@/lib/amountInput'
import { formatPrice } from '@/lib/utils'
import type { PositionItem } from '@/types/position'
import type { QuoteItem, StockCatalogEntry } from '@/types/market'

export interface PositionDraft {
  code: string
  name: string
  market: QuoteItem['market']
  shares: number
  originalCost: number
  actualCost: number
  entry?: StockCatalogEntry
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

const MARKET_LABEL: Record<string, string> = {
  'a-share': 'A股',
  'hk-stock': '港股',
  'us-stock': '美股',
  futures: '期货',
}

export function PositionEditor({
  isOpen,
  quotes,
  existingCodes,
  editing,
  onClose,
  onSubmit,
}: PositionEditorProps) {
  const shelfOptions = useMemo(
    () => (editing ? quotes.filter((q) => q.code === editing.code) : quotes.filter((q) => !existingCodes.includes(q.code))),
    [quotes, existingCodes, editing],
  )

  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<StockCatalogEntry | null>(null)
  const [code, setCode] = useState('')
  const [shares, setShares] = useState('')
  const [originalCost, setOriginalCost] = useState('')
  const [actualCost, setActualCost] = useState('')
  const [hint, setHint] = useState('')

  const { hits, loading } = useStockSearch(query, existingCodes)

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setPicked(null)
    setHint('')
    if (editing) {
      setCode(editing.code)
      setShares(String(editing.shares))
      setOriginalCost(String(editing.originalCost))
      setActualCost(String(editing.actualCost))
      return
    }
    setCode('')
    setShares('100')
    setOriginalCost('')
    setActualCost('')
  }, [isOpen, editing])

  const quote = quotes.find((q) => q.code === code)
  const selectedName = editing?.name ?? quote?.name ?? picked?.name ?? ''
  const selectedMarket = quote?.market ?? picked?.market ?? 'a-share'
  const livePrice = quote?.price && quote.price > 0 ? quote.price : null

  const shareCount = parseShareCount(shares)
  const cost = parseCostPrice(originalCost)
  const actual = parseCostPrice(actualCost)
  const hasStock = Boolean(editing || quote || picked)

  const applyStock = (nextCode: string, nextPrice?: number, entry?: StockCatalogEntry) => {
    setCode(nextCode)
    setPicked(entry ?? null)
    setQuery('')
    setHint('')
    if (nextPrice && nextPrice > 0) {
      const price = String(nextPrice)
      setOriginalCost(price)
      setActualCost(price)
    }
  }

  const fillFromPrice = () => {
    if (!livePrice) return
    const price = String(livePrice)
    setOriginalCost(price)
    setActualCost((prev) => prev || price)
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!hasStock) {
      setHint('先搜一只股票，或从看板里挑一只还没记持仓的。')
      return
    }
    if (!shareCount || !cost) {
      setHint('股数和原始成本都要大于 0，才能添加。')
      return
    }
    const ok = onSubmit({
      code,
      name: selectedName,
      market: selectedMarket,
      shares: shareCount,
      originalCost: cost,
      actualCost: actual ?? cost,
      entry: picked ?? undefined,
    })
    if (ok) onClose()
    else setHint('没有加上。若这只已经有持仓，请直接点卡片编辑。')
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
          <Button type="button" onClick={() => handleSubmit()}>
            {editing ? '保存' : '添加'}
          </Button>
        </>
      }
    >
      <form id="position-editor-form" className="space-y-3" noValidate onSubmit={handleSubmit}>
        {editing ? (
          <p className="text-sm text-neutral-500">
            {editing.name}
            <span className="font-mono tabular text-neutral-400 ml-2">{editing.code}</span>
          </p>
        ) : (
          <div className="space-y-2">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-400">股票</span>
              <input
                type="search"
                value={picked || quote ? `${selectedName} ${code}` : query}
                onChange={(e) => {
                  setPicked(null)
                  setCode('')
                  setQuery(e.target.value)
                }}
                onFocus={() => {
                  if (picked || quote) {
                    setQuery('')
                    setPicked(null)
                    setCode('')
                  }
                }}
                placeholder="代码或名称，如 603993 / 洛阳钼业"
                className={`${fieldClass} font-sans`}
              />
            </label>
            {query.trim() && (
              <div className="rounded-xl border border-black/[0.06] overflow-hidden bg-white">
                {quotes
                  .filter(
                    (q) =>
                      existingCodes.includes(q.code) &&
                      (q.name.includes(query.trim()) || q.code.includes(query.trim())),
                  )
                  .slice(0, 3)
                  .map((q) => (
                    <p key={q.code} className="px-3 py-2.5 text-sm text-neutral-500">
                      {q.name} 已有持仓，请关掉窗口后点卡片编辑。
                    </p>
                  ))}
                {loading && hits.length === 0 ? (
                  <p className="px-3 py-2.5 text-sm text-neutral-400">正在搜索…</p>
                ) : hits.length === 0 &&
                  !quotes.some(
                    (q) =>
                      existingCodes.includes(q.code) &&
                      (q.name.includes(query.trim()) || q.code.includes(query.trim())),
                  ) ? (
                  <p className="px-3 py-2.5 text-sm text-neutral-400">未找到「{query}」</p>
                ) : (
                  hits.slice(0, 6).map((entry) => (
                    <button
                      key={entry.code}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyStock(entry.code, entry.basePrice, entry)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-black/[0.04] last:border-0 active:bg-neutral-50"
                    >
                      <span>
                        <span className="text-[15px] text-neutral-900">{entry.name}</span>
                        <span className="ml-2 font-mono tabular text-[12px] text-neutral-400">
                          {entry.code} · {MARKET_LABEL[entry.market] ?? entry.market}
                        </span>
                      </span>
                      <span className="text-[13px] text-[#007AFF]">选用</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {!query.trim() && !picked && !quote && shelfOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {shelfOptions.slice(0, 8).map((q) => (
                  <button
                    key={q.code}
                    type="button"
                    onClick={() => applyStock(q.code, q.price)}
                    className="px-2.5 py-1 rounded-full bg-black/[0.04] text-[13px] text-neutral-700"
                  >
                    {q.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(quote || picked) && (
          <p className="text-xs text-neutral-400">
            {livePrice ? (
              <>
                现价 <span className="font-mono tabular text-neutral-700">{formatPrice(livePrice)}</span>
                <button type="button" onClick={fillFromPrice} className="ml-2 text-[#007AFF]">
                  用现价填成本
                </button>
              </>
            ) : (
              '成本按你的买入价填，现价随后跟行情更新。'
            )}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-neutral-400">持股数量</span>
            <input
              type="text"
              inputMode="numeric"
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
              placeholder={livePrice ? String(livePrice) : '买入价'}
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

        {hint && <p className="text-[12px] text-red-600">{hint}</p>}

        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-[#007AFF] text-white text-[16px] font-medium active:scale-[0.99]"
        >
          {editing ? '保存持仓' : '添加持仓'}
        </button>
      </form>
    </Modal>
  )
}
