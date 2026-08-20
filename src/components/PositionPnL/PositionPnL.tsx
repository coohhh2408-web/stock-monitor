import { SummaryCards } from './SummaryCards'
import { PositionList } from './PositionList'
import { useAppStore } from '@/store/AppStore'

export function PositionPnL({ isMobile = false }: { isMobile?: boolean }) {
  const {
    quotes,
    positions,
    tTrades,
    summary,
    recordTTrade,
    upsertPosition,
    deletePosition,
    reorderPositions,
  } = useAppStore()

  return (
    <div>
      {isMobile ? (
        <header className="mb-6">
          <h1 className="text-[34px] font-bold tracking-tight text-neutral-900 leading-none">持仓</h1>
          <p className="text-[15px] text-neutral-500 mt-2">市值和盈亏跟行情一起更新</p>
        </header>
      ) : (
        <header className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-[17px] font-semibold text-neutral-800 tracking-tight">持仓盈亏与做T</h2>
          <p className="text-[11px] text-neutral-400 shrink-0">拖拽卡片左侧 ≡ 可调整持仓顺序</p>
        </header>
      )}

      <SummaryCards summary={summary} />
      <PositionList
        quotes={quotes}
        positions={positions}
        tTradeRecords={tTrades}
        isMobile={isMobile}
        onTTradeSubmit={(id, form, result) => recordTTrade(id, form, result)}
        onUpsert={(draft) => upsertPosition(draft)}
        onDelete={deletePosition}
        onReorder={reorderPositions}
      />
    </div>
  )
}
