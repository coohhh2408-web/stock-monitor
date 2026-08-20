import { useState } from 'react'
import { SummaryCards } from './SummaryCards'
import { PositionList } from './PositionList'
import { PositionEditor, type PositionDraft } from './PositionEditor'
import { useAppStore } from '@/store/AppStore'
import { lightTap } from '@/lib/nativeInit'
import type { PositionItem } from '@/types/position'

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
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PositionItem | null>(null)

  const openCreate = () => {
    void lightTap()
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (pos: PositionItem) => {
    setEditing(pos)
    setEditorOpen(true)
  }

  const handleSubmit = (draft: PositionDraft) => upsertPosition({ ...draft, id: editing?.id })

  return (
    <div>
      {isMobile ? (
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-neutral-900 leading-none">持仓</h1>
            <p className="text-[15px] text-neutral-500 mt-2">市值和盈亏跟行情一起更新</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 mt-1 text-[17px] font-medium text-[#007AFF] active:opacity-60"
          >
            添加
          </button>
        </header>
      ) : (
        <header className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-[17px] font-semibold text-neutral-800 tracking-tight">持仓盈亏与做T</h2>
          <p className="text-[11px] text-neutral-400 shrink-0">拖拽卡片左侧 ≡ 可调整持仓顺序</p>
        </header>
      )}

      <SummaryCards summary={summary} isMobile={isMobile} />
      <PositionList
        quotes={quotes}
        positions={positions}
        tTradeRecords={tTrades}
        isMobile={isMobile}
        onTTradeSubmit={(id, form, result) => recordTTrade(id, form, result)}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={deletePosition}
        onReorder={reorderPositions}
      />
      <PositionEditor
        isOpen={editorOpen}
        quotes={quotes}
        existingCodes={positions.map((p) => p.code)}
        editing={editing}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
