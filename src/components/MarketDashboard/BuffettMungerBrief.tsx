import { useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn, formatQuotePrice } from '@/lib/utils'
import { buildBuffettMungerBrief, inferBusinessKind, stanceLabel, type SageTake, type ValueStance } from '@/services/buffettMunger'
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
import {
  buildValueChecklist,
  type ChecklistVerdict,
  type GateState,
  type ValueChecklist,
} from '@/services/valueChecklist'
import { classifyStrike } from '@/services/strikeZone'
import { answerLabel, type GateAnswer, type InfoRichness } from '@/services/valueSkill'
import { buildEarningsBrief, type EarningsBrief } from '@/services/earningsBrief'
import type { FinancialsPack, QuoteItem } from '@/types/market'

type SageView = 'list' | 'earnings' | 'research'
type SageTone = 'buffett' | 'munger' | 'duan'
type ResearchView = 'prose' | 'skill'
type FinStatus = 'loading' | 'ready' | 'empty'

export function BuffettMungerBrief({
  stock,
  financials = null,
  financialsStatus = 'empty',
}: {
  stock: QuoteItem
  financials?: FinancialsPack | null
  financialsStatus?: FinStatus
}) {
  const [view, setView] = useState<SageView>('list')
  const [research, setResearch] = useState<ResearchView>('prose')
  const checklist = buildValueChecklist(stock, financials?.latest)
  const prose = view === 'research' ? buildBuffettMungerBrief(stock) : null
  const skill = view === 'research' ? buildSkillBrief(stock) : null
  const earnings =
    view === 'earnings' && financials ? buildEarningsBrief(stock.name, inferBusinessKind(stock), financials) : null

  return (
    <section className="mb-4">
      <SegmentedControl
        options={[
          { value: 'list' as const, label: '清单' },
          { value: 'earnings' as const, label: '财报' },
          { value: 'research' as const, label: '研究对照' },
        ]}
        value={view}
        onChange={setView}
        fullWidth
        className="mb-3"
      />

      {view === 'list' && <ChecklistCard brief={checklist} stock={stock} />}
      {view === 'earnings' && (
        <EarningsCard
          stock={stock}
          brief={earnings}
          status={financialsStatus}
          pack={financials}
        />
      )}

      {view === 'research' && prose && skill && (
        <>
          <SegmentedControl
            options={[
              { value: 'prose' as const, label: '三人短评' },
              { value: 'skill' as const, label: '打分清单' },
            ]}
            value={research}
            onChange={setResearch}
            fullWidth
            className="mb-3"
          />
          {research === 'prose' ? (
            <div className="grid grid-cols-1 gap-2.5">
              <SageCard take={prose.buffett} tone="buffett" stock={stock} />
              <SageCard take={prose.munger} tone="munger" stock={stock} />
              <SageCard take={prose.duan} tone="duan" stock={stock} />
            </div>
          ) : (
            <SkillMemo brief={skill} stock={stock} />
          )}
        </>
      )}
      <ProvenanceNote />
    </section>
  )
}

function ChecklistCard({ brief, stock }: { brief: ValueChecklist; stock: QuoteItem }) {
  const lane = classifyStrike(brief)
  return (
    <article className="inset-group overflow-hidden">
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-[16px] font-semibold text-neutral-900 leading-snug">{brief.headline}</p>
          <VerdictChip verdict={brief.verdict} />
        </div>
        <p className="text-[13px] text-neutral-600 leading-relaxed">{brief.reason}</p>
        {lane === 'zone' && (
          <p className="text-[12px] text-[#FF3B30] mt-2 leading-relaxed">
            当前落在击球点：质量关未过关为 0，且进入习惯买点带。不是荐股。
          </p>
        )}
        {lane === 'sweet' && (
          <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed">
            只到甜蜜点：倍数到了，质量关未知或未过关，还不能算击球点。
          </p>
        )}
      </div>

      <div className="px-4 py-3 bg-neutral-50/80 border-y border-neutral-100">
        <p className="text-[10px] text-neutral-400 mb-1">习惯买点</p>
        <p className="text-[22px] font-semibold tabular tracking-tight text-neutral-900">
          {brief.habitPrice !== null ? formatQuotePrice(brief.habitPrice, stock.market) : '—'}
          {brief.habitPrice !== null && (
            <span className="text-[13px] font-medium text-neutral-400 ml-2">
              现价 {formatQuotePrice(stock.price, stock.market)} · {formatVsNow(brief.habitPrice, stock.price)}
            </span>
          )}
        </p>
        <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">{brief.formula}</p>
      </div>

      <ul className="px-4 py-2 divide-y divide-neutral-100">
        {brief.gates.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <GateDot state={item.state} />
              <p className="text-[13px] text-neutral-800">{item.label}</p>
            </div>
            <p className="text-[12px] text-neutral-500 tabular truncate max-w-[58%] text-right">{item.note}</p>
          </li>
        ))}
      </ul>

      <EightGates brief={brief} />

      <div className="px-4 py-3 border-t border-neutral-100">
        <p className="text-[11px] font-medium text-neutral-400 mb-2">三种习惯买点（同一公式，宽严不同）</p>
        <ul className="space-y-2">
          {brief.lenses.map((lens) => (
            <li key={lens.author} className="flex items-baseline justify-between gap-2">
              <p className="text-[13px] text-neutral-700">
                {lens.author}
                <span className="text-neutral-400 ml-1.5">{lens.actionLabel}</span>
              </p>
              <p className="text-[13px] font-medium tabular text-neutral-900">
                {formatPlanPrice(lens.buyTo, stock)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function EightGates({ brief }: { brief: ValueChecklist }) {
  const skill = brief.skill
  return (
    <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[11px] font-medium text-neutral-400">八道关</p>
        <RichnessChip richness={skill.richness} />
      </div>
      <p className="text-[12px] text-neutral-600 leading-relaxed mb-2">{skill.filterNote}</p>
      <ul className="space-y-2">
        {skill.gates.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-neutral-800">
                <span className="text-neutral-400 tabular mr-1.5">{item.id}</span>
                {item.dimension}
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed mt-0.5">{item.note}</p>
            </div>
            <AnswerChip answer={item.answer} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function RichnessChip({ richness }: { richness: InfoRichness }) {
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-neutral-500 border border-black/[0.04]">
      信息 {richness} 级
    </span>
  )
}

function AnswerChip({ answer }: { answer: GateAnswer }) {
  const color =
    answer === 'yes'
      ? 'bg-emerald-50 text-emerald-700'
      : answer === 'no'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-neutral-100 text-neutral-500'
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0', color)}>
      {answerLabel(answer)}
    </span>
  )
}

function VerdictChip({ verdict }: { verdict: ChecklistVerdict }) {
  const map: Record<ChecklistVerdict, { label: string; className: string }> = {
    'in-band': { label: '到买点带', className: 'bg-emerald-50 text-emerald-700' },
    wait: { label: '未到买点', className: 'bg-amber-50 text-amber-700' },
    skip: { label: '不适用', className: 'bg-neutral-100 text-neutral-500' },
    'no-data': { label: '先不报价', className: 'bg-sky-50 text-sky-700' },
  }
  const item = map[verdict]
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0', item.className)}>
      {item.label}
    </span>
  )
}

function GateDot({ state }: { state: GateState }) {
  const color =
    state === 'pass'
      ? 'bg-emerald-500'
      : state === 'warn'
        ? 'bg-amber-400'
        : state === 'fail'
          ? 'bg-neutral-400'
          : 'bg-neutral-200'
  return <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color)} />
}

function EarningsCard({
  stock,
  brief,
  status,
  pack,
}: {
  stock: QuoteItem
  brief: EarningsBrief | null
  status: FinStatus
  pack: FinancialsPack | null
}) {
  if (status === 'loading') {
    return (
      <article className="inset-group px-4 py-8 text-center">
        <p className="text-[13px] text-neutral-500">正在同步最新报告期…</p>
      </article>
    )
  }
  if (stock.market === 'futures' || !brief || !pack) {
    return (
      <article className="inset-group px-4 py-6">
        <p className="text-[14px] font-semibold text-neutral-800">这一期财报还没拉到</p>
        <p className="text-[13px] text-neutral-500 mt-2 leading-relaxed">
          东财 datacenter、同花顺三表和 F10 都没有可用主要指标时，不解读。未知不能填成结论。
        </p>
      </article>
    )
  }
  return (
    <article className="inset-group overflow-hidden">
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[16px] font-semibold text-neutral-900 leading-snug">{brief.headline}</p>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 shrink-0">
            {brief.periodLabel.split(' · ')[0]}
          </span>
        </div>
        <p className="text-[12px] text-neutral-400">{brief.periodLabel}</p>
      </div>
      <div className="px-4 py-3 bg-neutral-50/80 border-y border-neutral-100 grid grid-cols-2 gap-x-3 gap-y-2">
        {brief.metrics.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-[10px] text-neutral-400">{item.label}</p>
            <p className="text-[13px] font-medium tabular text-neutral-800 truncate">{item.value}</p>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-neutral-100">
        {brief.lenses.map((item) => (
          <li key={item.author} className="px-4 py-3">
            <p className="text-[13px] font-semibold text-neutral-800">{item.author}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{item.lens}</p>
            <p className="text-[13px] text-neutral-700 leading-relaxed mt-1.5">{item.take}</p>
          </li>
        ))}
      </ul>
      <p className="px-4 py-3 text-[11px] text-neutral-400 leading-relaxed border-t border-neutral-100">
        {brief.limit}
      </p>
    </article>
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
        <PlanCell label="仓位纪律对照" value={`首笔 ${plan.firstLotPct} · 上限 ${plan.maxLotPct}`} />
        <PlanCell label="买入区" value={buy} hint={buyVs} />
        <PlanCell
          label="加仓"
          value={formatPlanPrice(plan.addAt, stock)}
          hint={formatVsNow(plan.addAt, plan.nowPrice)}
        />
        <PlanCell
          label="减仓"
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
    <article className="inset-group overflow-hidden">
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
          <p className="text-[11px] font-semibold text-neutral-800 mb-2">三人买点对照</p>
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
      {plan.buyTo !== null ? ` · 习惯买点 ${formatPlanPrice(plan.buyTo, stock)}` : ''}
    </p>
  )
}

function ProvenanceNote() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 inset-group px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-[12px] font-medium text-neutral-700">依据与边界</span>
        <span className="text-[11px] text-[#007AFF]">{open ? '收起' : '数字怎么来的'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-[12px] text-neutral-600 leading-relaxed">
          <p>清单按本产品的《价值清单 skill》执行：先过八道关，缺数据就标未知，未知不等于不通过。</p>
          <p>市盈率来自上方同一路盘口。最新年报/半年报/季报优先来自东方财富 datacenter（浏览器可直连），A 股再备同花顺财务报表；开发环境仍可能走 F10 代理。和上方财报条同一路。不是年报原文，也没有电话会。雪球深度数据需要登录，本产品不接。</p>
          <p>赚钱质量看经营现金流÷净利；负债安全看资产负债率、流动比率，有则加上利息覆盖。金融股不硬套普通企业杠杆。</p>
          <p>三人财报解读是同一组数字的三种框架，不是大师原话。没有 MD&A 就不判断管理层是否坦诚。</p>
          <p>习惯买点 = 现价 ×（该行业习惯市盈率 ÷ 当前市盈率）。巴菲特/芒格/段永平只是同一公式的三种宽严，不是三人原话或持仓。</p>
          <p>结构借鉴了开源研究流程的写法（两分钟筛选、信息分级、数字用代码算）。不是微调了巴菲特模型，也不是股东信摘要。</p>
          <p>缺市盈率就不报价。这不是内在价值，也不能当投顾建议。收费卖的是清单和提醒，不是荐股。</p>
          <p>行情页「击球点」只扫当前看板，不是全 A 股。好球区要求质量关未过关为 0 且有产品内置说明；甜蜜点仍是习惯买点带。看板扫描不拉年报。</p>
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
