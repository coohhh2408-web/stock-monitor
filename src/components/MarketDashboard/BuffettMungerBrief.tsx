import { cn } from '@/lib/utils'
import { buildBuffettMungerBrief, stanceLabel, type SageTake, type ValueStance } from '@/services/buffettMunger'
import type { QuoteItem } from '@/types/market'

export function BuffettMungerBrief({ stock }: { stock: QuoteItem }) {
  const brief = buildBuffettMungerBrief(stock)
  return (
    <section className="mb-4">
      <div className="flex items-end justify-between gap-3 mb-2.5">
        <div>
          <p className="text-[13px] font-semibold text-neutral-800">巴菲特 / 芒格速评</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">按公开投资框架模拟，非二人原话或持仓</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <SageCard take={brief.buffett} tone="buffett" />
        <SageCard take={brief.munger} tone="munger" />
      </div>
    </section>
  )
}

function SageCard({ take, tone }: { take: SageTake; tone: 'buffett' | 'munger' }) {
  const isBuffett = tone === 'buffett'
  return (
    <article
      className={cn(
        'rounded-2xl p-4 border',
        isBuffett
          ? 'bg-gradient-to-br from-amber-50/90 to-white border-amber-200/70'
          : 'bg-gradient-to-br from-slate-50 to-white border-slate-200/80',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0',
              isBuffett ? 'bg-[#1F6B4A]' : 'bg-[#334155]',
            )}
          >
            {isBuffett ? '巴' : '芒'}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-neutral-900 leading-tight">{take.author}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{take.lens}</p>
          </div>
        </div>
        <StancePill stance={take.stance} />
      </div>
      <p className="text-[13px] text-neutral-700 leading-relaxed">{take.summary}</p>
    </article>
  )
}

function StancePill({ stance }: { stance: ValueStance }) {
  const color =
    stance === 'constructive'
      ? 'bg-emerald-50 text-emerald-700'
      : stance === 'skeptical'
        ? 'bg-neutral-100 text-neutral-500'
        : 'bg-amber-50 text-amber-700'
  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', color)}>
      {stanceLabel(stance)}
    </span>
  )
}
