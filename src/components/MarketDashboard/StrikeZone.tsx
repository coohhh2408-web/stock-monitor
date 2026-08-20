import { useMemo } from 'react'
import { Shelf } from '@/components/ui/Shelf'
import { cn, formatQuotePrice } from '@/lib/utils'
import { lightTap } from '@/lib/nativeInit'
import { scanStrikeZone, type StrikeHit } from '@/services/strikeZone'
import type { QuoteItem } from '@/types/market'

export function StrikeZone({
  quotes,
  isMobile = false,
  onOpen,
}: {
  quotes: QuoteItem[]
  isMobile?: boolean
  onOpen: (stock: QuoteItem) => void
}) {
  const scan = useMemo(() => scanStrikeZone(quotes), [quotes])

  const subtitle = `扫当前看板 ${scan.scanned} 只，不是全市场`

  if (isMobile) {
    const empty = scan.zone.length === 0 && scan.sweet.length === 0
    return (
      <Shelf title="击球点" action={<span className="text-[13px] text-neutral-400 shrink-0">{subtitle}</span>}>
        {empty ? (
          <div className="shelf-card lockup-card px-5 py-10">
            <p className="text-[17px] font-semibold text-neutral-900">看板里还没有击球点</p>
            <p className="text-[13px] text-neutral-400 mt-2 leading-relaxed">
              要同时落在好球区（质量关未过关为 0）和甜蜜点（进入习惯买点带）。这不是荐股。
            </p>
          </div>
        ) : scan.zone.length === 0 ? (
          <>
            <div className="shelf-card lockup-card px-5 py-10">
              <p className="text-[17px] font-semibold text-neutral-900">没有击球点</p>
              <p className="text-[13px] text-neutral-400 mt-2 leading-relaxed">
                有只到甜蜜点的名字：倍数到了，质量关未知或未过关。
              </p>
            </div>
            {scan.sweet.slice(0, 8).map((hit) => (
              <StrikeCard key={hit.stock.id} hit={hit} onOpen={onOpen} />
            ))}
          </>
        ) : (
          scan.zone.map((hit) => <StrikeCard key={hit.stock.id} hit={hit} onOpen={onOpen} />)
        )}
      </Shelf>
    )
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">击球点</h2>
        <p className="text-[13px] text-neutral-400 shrink-0">{subtitle}</p>
      </div>
      <p className="text-[13px] text-neutral-500 mb-3 px-0.5 leading-relaxed">
        同一套八道关：好球区是质量关未过关为 0 且有产品内置说明；甜蜜点是现价进入习惯买点带。看板扫描不拉年报。倍数到了 ≠ 该买。
      </p>

      {scan.zone.length > 0 ? (
        <HitList items={scan.zone} onOpen={onOpen} />
      ) : (
        <div className="lockup-card px-5 py-10 text-center">
          <p className="text-[17px] font-semibold text-neutral-900">当前没有击球点</p>
          <p className="text-[13px] text-neutral-400 mt-2 leading-relaxed">
            {scan.sweet.length > 0
              ? `有 ${scan.sweet.length} 只只到甜蜜点：倍数到了，质量关未知或未过关，不算挥棒。`
              : '把有市盈率的股票加进看板后，会按价值清单规则重算。'}
          </p>
        </div>
      )}

      {scan.zone.length > 0 && scan.sweet.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] text-neutral-400 mb-2 px-0.5">仅甜蜜点 · 不算击球点</p>
          <HitList items={scan.sweet} onOpen={onOpen} muted />
        </div>
      )}
    </section>
  )
}

function HitList({
  items,
  onOpen,
  muted = false,
}: {
  items: StrikeHit[]
  onOpen: (stock: QuoteItem) => void
  muted?: boolean
}) {
  return (
    <div className="lockup-card overflow-hidden">
      <ul>
        {items.map((hit, i) => (
          <li key={hit.stock.id}>
            <button
              type="button"
              onClick={() => {
                void lightTap()
                onOpen(hit.stock)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left min-h-[56px] press-float',
                i < items.length - 1 && 'border-b border-black/[0.06]',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-neutral-900 truncate">{hit.stock.name}</p>
                <p className="text-[12px] text-neutral-400 mt-0.5 truncate">{hit.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn('text-[15px] font-semibold tabular', muted ? 'text-neutral-500' : 'text-[#FF3B30]')}>
                  {hit.habitPrice !== null ? formatQuotePrice(hit.habitPrice, hit.stock.market) : '—'}
                </p>
                <p className="text-[12px] text-neutral-400 tabular mt-0.5">
                  {hit.peNow !== null ? `${hit.peNow.toFixed(0)}×` : '无市盈率'}
                  {hit.vsNow ? ` · ${hit.vsNow}` : ''}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StrikeCard({ hit, onOpen }: { hit: StrikeHit; onOpen: (stock: QuoteItem) => void }) {
  const zone = hit.lane === 'zone'
  return (
    <button
      type="button"
      onClick={() => {
        void lightTap()
        onOpen(hit.stock)
      }}
      className="shelf-card lockup-card press-float text-left p-5 min-h-[168px] flex flex-col"
    >
      <p className="text-[13px] text-neutral-400">{zone ? '击球点' : '仅甜蜜点'}</p>
      <p className="text-[20px] font-semibold text-neutral-900 mt-2 truncate">{hit.stock.name}</p>
      <p className="text-[28px] font-bold tracking-tight tabular text-neutral-900 mt-auto">
        {hit.habitPrice !== null ? formatQuotePrice(hit.habitPrice, hit.stock.market) : '—'}
      </p>
      <p className="text-[13px] text-neutral-400 mt-1 leading-snug">{hit.note}</p>
    </button>
  )
}
