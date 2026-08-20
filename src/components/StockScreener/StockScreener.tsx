import { useEffect, useMemo, useState } from 'react'
import { cn, formatListedCode, formatPercent, formatQuotePrice } from '@/lib/utils'
import { useAppStore } from '@/store/AppStore'
import { fetchScreenerUniverse, type ScreenerMarket } from '@/services/screenerApi'
import { runScreener, SCREENER_PRESETS, toScreenerPick, type ScreenerHit, type ScreenerPick, type ScreenerPreset } from '@/services/stockScreener'
import { StockDetailPanel } from '@/components/MarketDashboard/StockDetailPanel'
import type { QuoteItem, StockCatalogEntry } from '@/types/market'

const MARKETS: { value: ScreenerMarket; label: string }[] = [
  { value: 'a-share', label: 'A股' },
  { value: 'hk-stock', label: '港股' },
  { value: 'us-stock', label: '美股' },
]

export function StockScreener({ isMobile = false }: { isMobile?: boolean }) {
  const { quotes, addStock, getAIDiagnosis, generateAI } = useAppStore()
  const [market, setMarket] = useState<ScreenerMarket>('a-share')
  const [preset, setPreset] = useState<ScreenerPreset>('in-band')
  const [universe, setUniverse] = useState<QuoteItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<{ quote: QuoteItem; pick: ScreenerPick } | null>(null)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError('')
    void fetchScreenerUniverse(market)
      .then((rows) => {
        if (cancelled) return
        setUniverse(rows)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setUniverse([])
        setStatus('error')
        setError(err instanceof Error ? err.message : '选股列表拉取失败')
      })
    return () => {
      cancelled = true
    }
  }, [market, reload])

  const hits = useMemo(() => runScreener(universe, preset), [universe, preset])
  const presetMeta = SCREENER_PRESETS.find((item) => item.id === preset) ?? SCREENER_PRESETS[0]
  const existing = useMemo(() => new Set(quotes.map((item) => item.code)), [quotes])
  const openHit = (hit: ScreenerHit) => {
    setSelected({ quote: hit.quote, pick: toScreenerPick(hit, preset) })
  }

  return (
    <div>
      {!isMobile && (
        <header className="mb-4">
          <h2 className="text-[17px] font-semibold text-neutral-800 tracking-tight">价值选股</h2>
          <p className="text-[12px] text-neutral-400 mt-1">按习惯市盈率带筛市值靠前的样本，不是荐股。</p>
        </header>
      )}
      {isMobile && (
        <p className="text-[12px] text-neutral-400 mb-3">按习惯市盈率带筛市值靠前的样本，不是荐股。</p>
      )}

      <ChipRow
        isMobile={isMobile}
        options={MARKETS}
        value={market}
        onChange={setMarket}
      />
      <ChipRow
        isMobile={isMobile}
        options={SCREENER_PRESETS.map((item) => ({ value: item.id, label: item.label }))}
        value={preset}
        onChange={setPreset}
      />

      <p className="text-[13px] text-neutral-700 leading-relaxed mb-1">{presetMeta.hint}</p>
      {preset === 'in-band' && (
        <p className="text-[12px] text-neutral-500 leading-relaxed mb-3">
          大市值里银行、保险更容易进习惯带，因为市盈率低。不是筛坏了。要看消费，点上面「消费特许经营权」。点一行能看到入选逻辑和巴芒段短评。
        </p>
      )}
      {preset !== 'in-band' && <div className="mb-3" />}

      {status === 'loading' && (
        <p className="text-[13px] text-neutral-400 py-12 text-center">正在拉取市值靠前的样本…</p>
      )}
      {status === 'error' && (
        <div className="text-center py-12">
          <p className="text-[13px] text-neutral-500">{error}</p>
          <button
            type="button"
            className="mt-3 text-[13px] text-[#007AFF]"
            onClick={() => setReload((n) => n + 1)}
          >
            重试
          </button>
        </div>
      )}
      {status === 'ready' && hits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[15px] text-neutral-700">这组条件没有结果</p>
          <p className="text-[13px] text-neutral-400 mt-1 leading-relaxed">
            当前只看大约 {universe.length} 只有市盈率的大市值样本。可换「离习惯带不远」或换市场。
          </p>
        </div>
      )}

      {status === 'ready' && hits.length > 0 && (
        <>
          <p className="text-[13px] text-neutral-600 mb-2">
            {universe.length} 只样本里，{hits.length} 只符合「{presetMeta.label}」
          </p>
          <ul className="space-y-3 bg-white">
            {hits.map((hit) => (
              <ScreenerRow
                key={`${hit.quote.market}:${hit.quote.code}`}
                hit={hit}
                onBoard={existing.has(hit.quote.code)}
                onOpen={() => openHit(hit)}
                onAdd={() => void addStock(toCatalog(hit.quote))}
              />
            ))}
          </ul>
        </>
      )}

      <ScreenerNote sampleSize={universe.length} />

      <StockDetailPanel
        isOpen={Boolean(selected)}
        stock={selected?.quote ?? null}
        pick={selected?.pick ?? null}
        aiDiagnosis={selected ? getAIDiagnosis(selected.quote) : { status: 'idle' }}
        onClose={() => setSelected(null)}
        onGenerateAI={(stock) => generateAI(stock)}
        isMobile={isMobile}
      />
    </div>
  )
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  isMobile,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  isMobile: boolean
}) {
  return (
    <div className={cn('flex gap-2 mb-2', isMobile ? 'overflow-x-auto pb-0.5 -mx-1 px-1' : 'flex-wrap')}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'shrink-0 px-3 py-1 rounded-full text-[13px] font-medium transition-colors',
            value === opt.value ? 'bg-neutral-800 text-white' : 'bg-black/[0.06] text-neutral-600',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ScreenerRow({
  hit,
  onBoard,
  onOpen,
  onAdd,
}: {
  hit: ScreenerHit
  onBoard: boolean
  onOpen: () => void
  onAdd: () => void
}) {
  const listed = formatListedCode(hit.quote.code, hit.quote.market)
  const gap = ((hit.habitPrice - hit.quote.price) / hit.quote.price) * 100
  return (
    <li className="quote-card !cursor-default">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-neutral-900 truncate leading-tight">{hit.quote.name}</p>
            <p className="text-[12px] text-neutral-500 font-mono tabular mt-0.5">
              {listed} · {hit.kindLabel}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[17px] font-semibold tabular text-neutral-900">
              {formatQuotePrice(hit.quote.price, hit.quote.market)}
            </p>
            <p className="text-[12px] tabular text-neutral-500 mt-0.5">{formatPercent(hit.quote.changePercent)}</p>
          </div>
        </div>
        <p className="mt-2 text-[12px] font-medium text-neutral-800">
          当前 {hit.peNow.toFixed(0)}x · 习惯 {hit.peHabit.toFixed(0)}x · {hit.statusLabel}
          {hit.status !== 'in-band' ? ` · 观察价 ${formatQuotePrice(hit.habitPrice, hit.quote.market)}（${gap.toFixed(0)}%）` : ''}
        </p>
        <p className="mt-1.5 text-[13px] text-neutral-700 leading-relaxed">
          入选原因：归为{hit.kindLabel}，习惯市盈率约 {hit.peHabit.toFixed(0)} 倍，现价大约 {hit.peNow.toFixed(0)} 倍。点开看完整逻辑和巴芒段短评。
        </p>
      </button>
      <div className="mt-3 flex items-center justify-end gap-3">
        <button type="button" onClick={onOpen} className="text-[13px] font-medium text-[#007AFF]">
          看入选逻辑和三人短评
        </button>
        {onBoard ? (
          <span className="text-[12px] text-neutral-400">已在看板</span>
        ) : (
          <button type="button" onClick={onAdd} className="text-[13px] font-medium text-neutral-800">
            加入看板
          </button>
        )}
      </div>
    </li>
  )
}

function ScreenerNote({ sampleSize }: { sampleSize: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="text-[12px] font-medium text-neutral-700">依据与边界</span>
        <span className="text-[11px] text-[#007AFF]">{open ? '收起' : '怎么筛的'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-[12px] text-neutral-600 leading-relaxed">
          <p>
            样本来自东方财富行情列表，按市值从大到小取约 {sampleSize || 200} 只，且必须有 0–80 倍之间的市盈率。权证、ST、基金不进样本。不是全市场穷举。
          </p>
          <p>
            生意类型用名称和东财行业关键词归类，和个股价值清单同一套规则。未归类的票默认不进「进入习惯带」，避免把「未知 15 倍」当成买点。
          </p>
          <p>
            习惯带来自本产品的 PE_BAND，不是大师原话。进入习惯带只说明倍数到了，不说明该买，也不给仓位。
          </p>
          <p>市盈率与个股页可能差一两个点：选股用东财列表字段，个股页用腾讯/东财盘口。收费卖的是筛法和清单，不是荐股。</p>
        </div>
      )}
    </div>
  )
}

function toCatalog(quote: QuoteItem): StockCatalogEntry {
  return {
    name: quote.name,
    code: quote.code,
    market: quote.market,
    basePrice: quote.price,
    secid: quote.secid,
  }
}
