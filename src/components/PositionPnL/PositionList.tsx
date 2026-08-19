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
      <div className="flex justify-end mb-3">
        <button
          onClick={openCreate}
          className="text-sm font-medium text-[#007AFF] bg-[#007AFF]/8 hover:bg-[#007AFF]/12 px-3 py-1.5 rounded-full transition-colors"
        >
          + 添加持仓
        </button>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-neutral-400">暂无持仓</p>
          <p className="text-xs text-neutral-400 mt-1">从看板选一只股票，填入股数和成本即可</p>
          <button onClick={openCreate} className="mt-3 text-sm text-[#007AFF] font-medium">
            添加第一笔持仓
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {positions.map((pos) => {
            const isOpen = expandedTimeline === pos.id
            const count = tTradeRecords.filter((r) => r.positionId === pos.id).length
            const quote = quotes.find((q) => q.code === pos.code)

            return (
              <PositionCard
                key={pos.id}
                position={pos}
                quote={quote}
                historyCount={count}
                isMobile={isMobile}
                onEdit={() => openEdit(pos)}
                onRecordT={() => {
                  setSelectedPosition(pos)
                  setModalOpen(true)
                }}
                onToggleHistory={() => setExpandedTimeline(isOpen ? null : pos.id)}
                onDelete={() => onDelete(pos.id)}
                onReorder={isMobile ? undefined : onReorder}
                historySlot={<TTradeTimeline isExpanded={isOpen} records={tTradeRecords} positionId={pos.id} />}
              />
            )
          })}
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
