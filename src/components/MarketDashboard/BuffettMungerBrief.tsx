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
  type MasterRow,
  type SkillBrief,
} from '@/services/buffettMungerSkill'
import { formatPlanPrice, formatVsNow, type SagePlan } from '@/services/sagePlan'
import type { QuoteItem } from '@/types/market'

type SageView = 'compare' | 'prose' | 'skill'
type SageTone = 'buffett' | 'munger' | 'duan'

export function BuffettMungerBrief({ stock }: { stock: QuoteItem }) {
  const [view, setView] = useState<SageView>('compare')
  const prose = buildBuffettMungerBrief(stock)
  const skill = buildSkillBrief(stock)

  return (
    <section className="mb-4">
      <div className="flex items-end justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-neutral-800">巴菲特 / 芒格 / 段永平</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">框架推演，不是荐股</p>
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
          title="三人短评 + 下一步"
          hint="买入区按现价/市盈率回推"
          className={view === 'compare' ? 'mb-3' : undefined}
        >
          <div className="grid grid-cols-1 gap-2.5">
            <SageCard take={prose.buffett} tone="buffett" stock={stock} />
            <SageCard take={prose.munger} tone="munger" stock={stock} />
            <SageCard take={prose.duan} tone="duan" stock={stock} />
          </div>
        </VersionBlock>
      )}

      {(view === 'compare' || view === 'skill') && (
        <VersionBlock
          kicker="框架版"
          title="清单推演"
          hint="强制结论 · 三人给不同买价"
        >
          <SkillMemo brief={skill} stock={stock} />
        </VersionBlock>
      )}
      <ProvenanceNote />
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

function SageCard({ take, tone, stock }: { take: SageTake; tone: SageTone; stock: QuoteItem }) {
  const mark = tone === 'buffett' ? '巴' : tone === 'munger' ? '芒' : '段'
  const chip =
    tone === 'buffett' ? 'bg-[#1F6B4A]' : tone === 'munger' ? 'bg-[#334155]' : 'bg-[#3730A3]'
  const board =
    tone === 'buffett'
      ? 'bg-gradient-to-br from-amber-50/90 to-white border-amber-200/70'
      : tone === 'munger'
        ? 'bg-gradient-to-br from-slate-50 to-white border-slate-200/80'
        : 'bg-gradient-to-br from-indigo-50/90 to-white border-indigo-200/70'
  return (
    <article className={cn('rounded-2xl p-4 border', board)}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white shrink-0', chip)}>
            {mark}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-neutral-900 leading-tight">{take.author}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{take.lens}</p>
          </div>
        </div>
        <StancePill stance={take.stance} />
      </div>
      <p className="text-[13px] text-neutral-700 leading-relaxed">{take.summary}</p>
      <PlanBlock plan={take.plan} stock={stock} />
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

function PlanBlock({ plan, stock }: { plan: SagePlan; stock: QuoteItem }) {
  const buy =
    plan.buyFrom !== null && plan.buyTo !== null
      ? `${formatPlanPrice(plan.buyFrom, stock)}–${formatPlanPrice(plan.buyTo, stock)}`
      : '—'
  const buyVs = plan.buyTo !== null ? formatVsNow(plan.buyTo, plan.nowPrice) : ''
  return (
    <div className="mt-3 pt-3 border-t border-black/[0.05]">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2">
        <PlanCell label="下一步" value={plan.actionLabel} />
        <PlanCell label="建议仓位" value={`首笔 ${plan.firstLotPct} · 上限 ${plan.maxLotPct}`} />
        <PlanCell label="买入区" value={buy} hint={buyVs} />
        <PlanCell
          label="加仓"
          value={formatPlanPrice(plan.addAt, stock)}
          hint={formatVsNow(plan.addAt, plan.nowPrice)}
        />
        <PlanCell
          label={plan.trimAt === null ? '减仓' : '减仓'}
          value={plan.trimAt === null ? '不因上涨卖' : formatPlanPrice(plan.trimAt, stock)}
          hint={formatVsNow(plan.trimAt, plan.nowPrice)}
        />
        <PlanCell
          label="现PE / 目标"
          value={
            plan.peNow !== null && plan.peTarget !== null
              ? `${plan.peNow.toFixed(0)}x → ${plan.peTarget.toFixed(0)}x`
              : plan.peNow !== null
                ? `${plan.peNow.toFixed(0)}x`
                : '无市盈率'
          }
        />
        <PlanCell
          label="重审"
          value={formatPlanPrice(plan.reviewAt, stock)}
          hint={formatVsNow(plan.reviewAt, plan.nowPrice)}
        />
      </div>
      <p className="text-[12px] text-neutral-700 leading-relaxed">{plan.nextStep}</p>
      <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{plan.basis}</p>
    </div>
  )
}

function PlanCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-neutral-400">{label}</p>
      <p className="text-[12px] font-medium tabular text-neutral-800 truncate">
        {value}
        {hint ? <span className="text-neutral-400 font-normal ml-1">{hint}</span> : null}
      </p>
    </div>
  )
}

function SkillMemo({ brief, stock }: { brief: SkillBrief; stock: QuoteItem }) {
  const priced = brief.masters.filter((row) => row.plan)
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
            {row.plan ? <PlanStrip plan={row.plan} stock={stock} /> : null}
          </li>
        ))}
      </ul>

      {priced.length > 0 && (
        <div className="px-4 py-3 border-t border-neutral-100 overflow-x-auto">
          <p className="text-[11px] font-semibold text-neutral-800 mb-2">三人下一步对照</p>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-neutral-400">
                <th className="font-medium pb-1 pr-2"> </th>
                {priced.map((row) => (
                  <th key={row.author} className="font-medium pb-1 pr-2">{row.author}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[11px] text-neutral-700">
              <CompareRow label="动作" rows={priced} render={(row) => row.plan!.actionLabel} />
              <CompareRow label="买入上沿" rows={priced} render={(row) => formatPlanPrice(row.plan!.buyTo, stock)} />
              <CompareRow label="加仓" rows={priced} render={(row) => formatPlanPrice(row.plan!.addAt, stock)} />
              <CompareRow label="首笔仓位" rows={priced} render={(row) => row.plan!.firstLotPct} />
            </tbody>
          </table>
        </div>
      )}

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

function CompareRow({
  label,
  rows,
  render,
}: {
  label: string
  rows: MasterRow[]
  render: (row: MasterRow) => string
}) {
  return (
    <tr>
      <td className="text-neutral-400 py-0.5 pr-2 whitespace-nowrap">{label}</td>
      {rows.map((row) => (
        <td key={row.author} className="tabular py-0.5 pr-2">{render(row)}</td>
      ))}
    </tr>
  )
}

function PlanStrip({ plan, stock }: { plan: SagePlan; stock: QuoteItem }) {
  return (
    <p className="text-[11px] text-neutral-600 mt-1.5 leading-relaxed">
      {plan.actionLabel}
      {plan.buyTo !== null ? ` · 等到 ${formatPlanPrice(plan.buyTo, stock)}` : ''}
      {` · 首笔 ${plan.firstLotPct}`}
    </p>
  )
}

function ProvenanceNote() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-[12px] font-medium text-neutral-700">依据与边界</span>
        <span className="text-[11px] text-[#007AFF]">{open ? '收起' : '为什么能看'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-[12px] text-neutral-600 leading-relaxed">
          <p>行情和市盈率来自上方同一路盘口（东方财富），不是另接一套「大师数据库」。</p>
          <p>文字是公开投资原则做成的本地规则：护城河、能力圈、对的价格。没有检索股东信，也没有调用在线大模型或 GitHub 上的投资 Skill。</p>
          <p>买入区算法：有市盈率时，买价 = 现价 ×（目标市盈率 ÷ 当前市盈率）；没有市盈率就用现价回撤带。目标市盈率按行业分档，三人宽严不同。这不是内在价值，也复现不了伯克希尔的决策。</p>
          <p>所以它能帮你把「好不好」收成可核对的数字，但不能当成巴菲特、芒格、段永平的原话、持仓或投顾意见。收费卖的应是工具和纪律，不是荐股。</p>
        </div>
      )}
    </div>
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
