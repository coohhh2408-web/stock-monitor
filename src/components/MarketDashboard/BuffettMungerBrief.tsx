import { useState, type ReactNode } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/lib/utils'
import { buildBuffettMungerBrief, stanceLabel, type SageTake, type ValueStance } from '@/services/buffettMunger'
import {
  buildSkillBrief,
  checklistLabels,
  starBar,
  VERDICT_LABEL,
  type GateVerdict,
  type SkillBrief,
} from '@/services/buffettMungerSkill'
import type { QuoteItem } from '@/types/market'

type SageView = 'compare' | 'prose' | 'skill'

export function BuffettMungerBrief({ stock }: { stock: QuoteItem }) {
  const [view, setView] = useState<SageView>('compare')
  const prose = buildBuffettMungerBrief(stock)
  const skill = buildSkillBrief(stock)

  return (
    <section className="mb-4">
      <div className="flex items-end justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-neutral-800">巴菲特 / 芒格速评</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">两套本地框架对照，非原话或持仓</p>
        </div>
      </div>
      <SegmentedControl
        options={[
          { value: 'compare' as const, label: '对照' },
          { value: 'prose' as const, label: '速评版' },
          { value: 'skill' as const, label: '框架版' },
        ]}
        value={view}
        onChange={setView}
        fullWidth
        className="mb-3"
      />

      {(view === 'compare' || view === 'prose') && (
        <VersionBlock
          kicker="速评版"
          title="人格化短评"
          hint="本地规则 · 巴菲特 / 芒格各一段话"
          className={view === 'compare' ? 'mb-3' : undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SageCard take={prose.buffett} tone="buffett" />
            <SageCard take={prose.munger} tone="munger" />
          </div>
        </VersionBlock>
      )}

      {(view === 'compare' || view === 'skill') && (
        <VersionBlock
          kicker="框架版"
          title="AI Berkshire 清单"
          hint="强制结论 · 四大师对抗 · 不编造买价"
        >
          <SkillMemo brief={skill} />
        </VersionBlock>
      )}
    </section>
  )
}

function VersionBlock({
  kicker,
  title,
  hint,
  className,
  children,
}: {
  kicker: string
  title: string
  hint: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2 mb-2 px-0.5">
        <p className="text-[12px] font-semibold text-neutral-800">
          <span className="text-neutral-400 font-medium mr-1.5">{kicker}</span>
          {title}
        </p>
        <p className="text-[10px] text-neutral-400 shrink-0">{hint}</p>
      </div>
      {children}
    </div>
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

function SkillMemo({ brief }: { brief: SkillBrief }) {
  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-neutral-100">
        <div className="flex items-center gap-2 min-w-0">
          <VerdictBadge verdict={brief.verdict} />
          <p className="text-[12px] text-neutral-500">
            综合 <span className="font-semibold tabular text-neutral-800">{brief.composite.toFixed(1)}</span>
          </p>
        </div>
        <p className="text-[10px] text-neutral-400 shrink-0">信息 {brief.richness} 级</p>
      </div>

      <div className="px-4 py-3 grid grid-cols-5 gap-1 border-b border-neutral-100">
        {checklistLabels().map((item) => (
          <div key={item.key} className="min-w-0 text-center">
            <p className="text-[9px] text-neutral-400 mb-0.5 truncate">{item.label}</p>
            <p className="text-[11px] text-amber-500 leading-none tracking-tight">{starBar(brief.scores[item.key])}</p>
          </div>
        ))}
      </div>

      <ul className="divide-y divide-neutral-100">
        {brief.masters.map((row) => (
          <li key={row.author} className="px-4 py-2.5">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <p className="text-[12px] font-semibold text-neutral-800">{row.author}</p>
              <p className="text-[11px] tabular text-neutral-500">{row.score.toFixed(1)}</p>
            </div>
            <p className="text-[12px] text-neutral-700 leading-relaxed">{row.take}</p>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">追问：{row.question}</p>
          </li>
        ))}
      </ul>

      <div className="px-4 py-3 bg-neutral-50/80 space-y-2">
        <p className="text-[12px] text-neutral-700 leading-relaxed">
          <span className="font-semibold text-neutral-800">倒过来想 </span>
          {brief.inversion}
        </p>
        <p className="text-[12px] text-neutral-600 leading-relaxed">{brief.strategy.empty}</p>
        <p className="text-[12px] text-neutral-600 leading-relaxed">{brief.strategy.holder}</p>
        <p className="text-[10px] text-neutral-400 leading-relaxed">{brief.limit}</p>
      </div>
    </article>
  )
}

function VerdictBadge({ verdict }: { verdict: GateVerdict }) {
  const color: Record<GateVerdict, string> = {
    pass: 'bg-emerald-50 text-emerald-700',
    conditional: 'bg-sky-50 text-sky-700',
    gray: 'bg-amber-50 text-amber-700',
    reject: 'bg-neutral-100 text-neutral-500',
  }
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', color[verdict])}>
      {VERDICT_LABEL[verdict]}
    </span>
  )
}
