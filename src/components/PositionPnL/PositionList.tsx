import { useState } from 'react'
import { PositionCard } from './PositionCard'
import { TTradeModal } from './TTradeModal'
import { TTradeTimeline } from './TTradeTimeline'
import { PositionEditor, type PositionDraft } from './PositionEditor'
import type { PositionItem, TTradeRecord, TTradeFormInput, TTradeCalculationResult } from '@/types/position'
import type { QuoteItem } from '@/types/market'

interface PositionListProps {
  quotes: QuoteItem[]
  positions: PositionItem[]
  tTradeRecords: TTradeRecord[]
  isMobile?: boolean
  onTTradeSubmit: (positionId: string, form: TTradeFormInput, result: TTradeCalculationResult) => void
  onUpsert: (draft: PositionDraft & { id?: string }) => boolean
  onDelete: (positionId: string) => void
  onReorder?: (fromId: string, toId: string) => void
}

export function PositionList({
  quotes,
  positions,
  tTradeRecords,
  isMobile = false,
  onTTradeSubmit,
  onUpsert,
  onDelete,
  onReorder,
}: PositionListProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<PositionItem | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<PositionItem | null>(null)

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (pos: PositionItem) => {
    setEditing(pos)
    setEditorOpen(true)
  }

  return (
    <>
      {positions.length === 0 ? (
        <div className="lockup-card px-4 py-14 text-center">
          <p className="text-[17px] font-semibold text-neutral-900">暂无持仓</p>
          <p className="text-[13px] text-neutral-400 mt-1">填入股数和成本后，盈亏会跟行情一起更新</p>
          <button onClick={openCreate} className="mt-4 text-[15px] text-[#007AFF] font-medium">
            添加第一笔持仓
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-neutral-900 mb-3 px-0.5">我的持仓</h2>
          <div className="space-y-3">
            {positions.map((pos) => {
              const historyOpen = expandedTimeline === pos.id
              const count = tTradeRecords.filter((r) => r.positionId === pos.id).length
              const quote = quotes.find((q) => q.code === pos.code)

              return (
                <div key={pos.id} className="lockup-card overflow-hidden">
                  <PositionCard
                    position={pos}
                    quote={quote}
                    historyCount={count}
                    expanded={expandedId === pos.id}
                    isMobile={isMobile}
                    onToggle={() => {
                      setExpandedId((id) => (id === pos.id ? null : pos.id))
                      if (expandedTimeline === pos.id) setExpandedTimeline(null)
                    }}
                    onEdit={() => openEdit(pos)}
                    onRecordT={() => {
                      setSelectedPosition(pos)
                      setModalOpen(true)
                    }}
                    onToggleHistory={() => setExpandedTimeline(historyOpen ? null : pos.id)}
                    historyOpen={historyOpen}
                    onDelete={() => onDelete(pos.id)}
                    onReorder={isMobile ? undefined : onReorder}
                    historySlot={
                      <TTradeTimeline isExpanded={historyOpen} records={tTradeRecords} positionId={pos.id} />
                    }
                  />
                </div>
              )
            })}
            <button
              type="button"
              onClick={openCreate}
              className="w-full lockup-card px-4 py-3.5 text-left text-[17px] text-[#007AFF] active:scale-[0.98] transition-transform"
            >
              添加持仓
            </button>
          </div>
        </div>
      )}

      <TTradeModal
        isOpen={modalOpen}
        position={selectedPosition}
        onClose={() => setModalOpen(false)}
        onSubmit={(form, result) => selectedPosition && onTTradeSubmit(selectedPosition.id, form, result)}
      />

      <PositionEditor
        isOpen={editorOpen}
        quotes={quotes}
        existingCodes={positions.map((p) => p.code)}
        editing={editing}
        onClose={() => setEditorOpen(false)}
        onSubmit={(draft) => onUpsert({ ...draft, id: editing?.id })}
      />
    </>
  )
}
