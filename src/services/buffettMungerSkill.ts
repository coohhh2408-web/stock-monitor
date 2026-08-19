import type { QuoteItem } from '@/types/market'
import { getEffectivePe, inferBusinessKind, type BusinessKind } from '@/services/buffettMunger'

export type GateVerdict = 'pass' | 'conditional' | 'gray' | 'reject'

export interface ChecklistScores {
  circle: number
  business: number
  moat: number
  management: number
  margin: number
}

export interface MasterRow {
  author: '巴菲特' | '芒格' | '段永平' | '李录'
  score: number
  take: string
  question: string
}

export interface SkillBrief {
  verdict: GateVerdict
  richness: 'B' | 'C'
  composite: number
  scores: ChecklistScores
  masters: MasterRow[]
  inversion: string
  strategy: { empty: string; holder: string }
  limit: string
}

const CHECKLIST_LABELS: { key: keyof ChecklistScores; label: string }[] = [
  { key: 'circle', label: '能力圈' },
  { key: 'business', label: '好生意' },
  { key: 'moat', label: '护城河' },
  { key: 'management', label: '管理层' },
  { key: 'margin', label: '安全边际' },
]

export function checklistLabels(): { key: keyof ChecklistScores; label: string }[] {
  return CHECKLIST_LABELS
}

export const VERDICT_LABEL: Record<GateVerdict, string> = {
  pass: '通过',
  conditional: '有条件',
  gray: '灰色地带',
  reject: '不通过',
}

interface KnownSkill {
  codes: string[]
  names: string[]
  scores: ChecklistScores
  masters: MasterRow[]
  inversion: string
}

const KNOWN: KnownSkill[] = [
  {
    codes: ['600519'],
    names: ['贵州茅台', '茅台'],
    scores: { circle: 5, business: 5, moat: 5, management: 3, margin: 4 },
    inversion: '礼赠与酒桌场景萎缩、批价体系失灵、把现金拿去乱并购。聪明人空它，多半空的是估值，不是生意。',
    masters: [
      { author: '巴菲特', score: 4.6, take: '特许经营权成立：品牌即定价权，再投资需求低。', question: '10年后这条护城河还在吗？什么能摧毁它？' },
      { author: '芒格', score: 4.0, take: '先写失败路径，再谈热爱。把奢侈品当周期股追涨，才是蠢事。', question: '我最可能在哪里犯错？' },
      { author: '段永平', score: 4.5, take: '一句话：卖身份认同的高毛利消费品。对的生意。', question: '如果股市明天关闭5年，你愿意以这个价格持有吗？' },
      { author: '李录', score: 4.0, take: '20年后回看，更像这个时代的液体奢侈品，不是昙花一现。', question: '它是这个时代的标准石油，还是3Com？' },
    ],
  },
  {
    codes: ['AAPL'],
    names: ['苹果', 'apple'],
    scores: { circle: 4, business: 5, moat: 5, management: 5, margin: 3 },
    inversion: '监管拆生态、服务增长停滞、换机周期永久拉长。空方打的是「硬件公司被当成消费特许经营权定价」。',
    masters: [
      { author: '巴菲特', score: 4.5, take: '用户锁在工作流与身份里，回购说明懂资本配置。', question: '10年后转换成本还在吗？' },
      { author: '芒格', score: 4.3, take: '别被科技标签吓跑。看客户是否年复一年付钱。', question: '聪明人为什么会不买？' },
      { author: '段永平', score: 4.4, take: '对的生意。对的价格取决于你是否在为完美执行付全款。', question: '关市5年你还持有吗？' },
      { author: '李录', score: 4.2, take: '消费电子里少见的文明级入口，不是单品周期公司。', question: '它是标准石油还是3Com？' },
    ],
  },
  {
    codes: ['NVDA'],
    names: ['英伟达', 'nvidia'],
    scores: { circle: 4, business: 5, moat: 5, management: 5, margin: 3 },
    inversion: 'CUDA 被替代、客户自研芯片、资本开支周期反转。当前价把乐观假设贴现完了。',
    masters: [
      { author: '巴菲特', score: 3.8, take: '伟大生意，但五年竞争格局不在能力圈中心。', question: '看不懂就路过，这是优势吗？' },
      { author: '芒格', score: 3.5, take: '高质量可以贵，但不能把完美执行变成义务。', question: '我最可能在估值上犯错。' },
      { author: '段永平', score: 3.7, take: '好生意。现在的价格是不是对的价格，要另算。', question: '关市5年你敢拿吗？' },
      { author: '李录', score: 4.2, take: '更接近文明级算力基础设施，确定性仍低于消费特许经营权。', question: '20年后是标准石油还是3Com？' },
    ],
  },
  {
    codes: ['300750'],
    names: ['宁德时代'],
    scores: { circle: 3, business: 4, moat: 3, management: 4, margin: 3 },
    inversion: '车企扶持第二供应商、固态路线切换、产能过剩把超额利润打回均值。',
    masters: [
      { author: '巴菲特', score: 3.2, take: '龙头值得尊重，但不是坐着收钱的生意。', question: '护城河要靠持续砸钱维持吗？' },
      { author: '芒格', score: 3.0, take: '成长叙事不是确定性。先看单位经济。', question: '聪明人为什么要空制造龙头？' },
      { author: '段永平', score: 3.3, take: '能做大，不等于对的生意。资本开支是硬伤。', question: '一句话讲清这门生意好在哪？' },
      { author: '李录', score: 3.6, take: '电动化是趋势，公司是趋势里的制造环节，不是规则制定者。', question: '它是标准石油还是3Com？' },
    ],
  },
  {
    codes: ['TSLA'],
    names: ['特斯拉', 'tesla'],
    scores: { circle: 3, business: 3, moat: 2, management: 3, margin: 1 },
    inversion: '价格战吞噬利润、自动驾驶叙事证伪、竞争者成本追上。必须永远完美执行才能证明估值。',
    masters: [
      { author: '巴菲特', score: 2.0, take: '汽车股东回报历史上平庸，故事股缺少安全边际。', question: '这是企业还是叙事？' },
      { author: '芒格', score: 1.8, take: '对必须完美执行的标的，默认说不。', question: '失败路径是否已经被定价忽略？' },
      { author: '段永平', score: 2.2, take: '能颠覆行业，不等于现在是对的价格。', question: '关市5年你愿意拿吗？' },
      { author: '李录', score: 3.0, take: '电动化趋势在，公司路径的十年确定性不够。', question: '标准石油还是3Com？' },
    ],
  },
  {
    codes: ['00700', '0700'],
    names: ['腾讯控股', '腾讯'],
    scores: { circle: 4, business: 5, moat: 5, management: 5, margin: 4 },
    inversion: '监管重击、流量红利结束、投资组合拖累业主收益。空方打的是「生态想象溢价」。',
    masters: [
      { author: '巴菲特', score: 4.4, take: '社交与支付网络效应是真护城河，游戏提供现金。', question: '看不懂的部分有多大，仓位就该多小。' },
      { author: '芒格', score: 3.8, take: '倒过来想：流量红利结束后还剩什么？', question: '为生态支付无限价格是不是蠢事？' },
      { author: '段永平', score: 4.3, take: '对的生意。对的人要看资本配置是否本分。', question: '一句话：这是卖什么的？' },
      { author: '李录', score: 4.1, take: '数字文明的入口之一，监管是情景风险，不该塞进折现率。', question: '20年后还是标准基础设施吗？' },
    ],
  },
  {
    codes: ['03690', '3690'],
    names: ['美团'],
    scores: { circle: 4, business: 4, moat: 4, management: 4, margin: 4 },
    inversion: '补贴战重启、履约成本抬升、本地生活被更大平台挤压。GMV 叙事替代不了自由现金流。',
    masters: [
      { author: '巴菲特', score: 3.4, take: '有网络效应，但履约重、竞争易变成补贴。', question: '经常性现金在哪里？' },
      { author: '芒格', score: 2.8, take: '烧钱训练用户不忠诚。先证明单位经济。', question: '增长停了还剩什么？' },
      { author: '段永平', score: 3.5, take: '模式能讲清，价格要另算。别把规模当护城河。', question: '对的生意还是对的故事？' },
      { author: '李录', score: 3.6, take: '本地生活数字化是趋势，十年确定性取决于单位经济而不是订单量。', question: '它会成为基础设施吗？' },
    ],
  },
  {
    codes: ['MSFT'],
    names: ['微软', 'microsoft'],
    scores: { circle: 4, business: 5, moat: 5, management: 5, margin: 3 },
    inversion: '云与 AI 资本开支回报不及预期、办公习惯迁移、反垄断。股价可能已透支乐观。',
    masters: [
      { author: '巴菲特', score: 4.4, take: '工作流锁定接近特许经营权，经常性收入可理解。', question: '10年后客户还在里面吗？' },
      { author: '芒格', score: 4.1, take: '显而易见的好生意，先问价格有没有把 AI 全部贴现。', question: '我最可能在估值上犯错。' },
      { author: '段永平', score: 4.3, take: '对的生意。对的价格不是今天这个「完美故事价」。', question: '关市5年你持有吗？' },
      { author: '李录', score: 4.4, take: '企业软件+云是文明级工具层，不是单品潮汐。', question: '标准石油还是3Com？' },
    ],
  },
  {
    codes: ['002594'],
    names: ['比亚迪'],
    scores: { circle: 3, business: 3, moat: 3, management: 4, margin: 3 },
    inversion: '补贴退坡、价格战、海外贸易壁垒。垂直整合在周期底部才见真章。',
    masters: [
      { author: '巴菲特', score: 3.0, take: '工厂很强，不等于股东回报很强。', question: '周期底部还能产生现金吗？' },
      { author: '芒格', score: 2.8, take: '研究不等于现在该按乐观假设下注。', question: '价格战之后利润归谁？' },
      { author: '段永平', score: 3.2, take: '能活下来值得研究。对的价格很少出现在高潮里。', question: '这是对的生意吗？' },
      { author: '李录', score: 3.5, take: '电动化趋势明确，公司仍是制造竞争，不是规则制定。', question: '20年后还在吗？' },
    ],
  },
  {
    codes: ['600036'],
    names: ['招商银行'],
    scores: { circle: 3, business: 4, moat: 4, management: 4, margin: 4 },
    inversion: '信贷周期、房地产连带、财富管理费率下行。杠杆会把一次误判放大。',
    masters: [
      { author: '巴菲特', score: 4.0, take: '零售与财富管理更接近特许经营权，仍要为坏账留余地。', question: '存款质量过关吗？' },
      { author: '芒格', score: 3.2, take: '金融股最大的风险是自以为懂。', question: '我最可能在杠杆上犯错。' },
      { author: '段永平', score: 3.8, take: '好银行是对的生意，前提是文化保守。', question: '对的人还在不在？' },
      { author: '李录', score: 3.4, take: '金融是文明的基础设施，个股确定性取决于风控文化。', question: '十年后它还是好银行吗？' },
    ],
  },
]

const KIND_SCORES: Record<BusinessKind, Omit<ChecklistScores, 'margin'>> = {
  'consumer-franchise': { circle: 4, business: 5, moat: 4, management: 3 },
  bank: { circle: 3, business: 4, moat: 3, management: 3 },
  insurance: { circle: 3, business: 4, moat: 3, management: 3 },
  platform: { circle: 3, business: 4, moat: 4, management: 3 },
  semiconductor: { circle: 2, business: 5, moat: 4, management: 4 },
  'ev-battery': { circle: 3, business: 4, moat: 3, management: 3 },
  commodity: { circle: 4, business: 2, moat: 1, management: 3 },
  auto: { circle: 3, business: 3, moat: 2, management: 3 },
  solar: { circle: 3, business: 2, moat: 1, management: 3 },
  pharma: { circle: 2, business: 4, moat: 3, management: 3 },
  telecom: { circle: 4, business: 3, moat: 3, management: 3 },
  utility: { circle: 4, business: 3, moat: 3, management: 4 },
  realty: { circle: 3, business: 2, moat: 1, management: 2 },
  manufacturing: { circle: 3, business: 3, moat: 2, management: 3 },
  futures: { circle: 5, business: 1, moat: 1, management: 1 },
  unknown: { circle: 2, business: 3, moat: 3, management: 3 },
}

const KIND_INVERSION: Record<BusinessKind, string> = {
  'consumer-franchise': '品牌溢价消失、渠道库存失控、替代品抢走习惯。聪明人空它，通常空估值。',
  bank: '信贷周期+杠杆。一次误判就会变成灾难。',
  insurance: '承保亏损、投资端冒险、浮存金被乱配。复杂报表是误判温床。',
  platform: '补贴停止后面目全非、监管、流量迁移。生态故事最容易假完整。',
  semiconductor: '下一代架构换人做、客户自研、周期杀估值。能力圈不够就不要硬懂。',
  'ev-battery': '扩产竞赛、第二供应商、技术路线切换。超额利润是暂时的。',
  commodity: '价格周期反转。没有定价权的生意，景气顶点最像陷阱。',
  auto: '价格战、重资产、周期底部现金枯竭。',
  solar: '产能过剩、技术路线作废、账面资产变沉没成本。',
  pharma: '大单品专利悬崖、政策定价、管线归零。',
  telecom: '监管削利润、资本开支吞噬现金。稳定也可能是平庸。',
  utility: '监管封顶回报。当成长股买是错配。',
  realty: '杠杆+去化。现金流可以突然消失。',
  manufacturing: '客户切换、产能被复制、某一两年景气退去。',
  futures: '这不是企业。方向看错加杠杆，本金可以归零。',
  unknown: '答不上「什么会永久亏掉本金」，就说明还不够了解。',
}

export function buildSkillBrief(stock: QuoteItem): SkillBrief {
  const known = matchKnown(stock)
  const kind = inferBusinessKind(stock)
  const pe = getEffectivePe(stock)
  const margin = blendMargin(known?.scores.margin, pe)
  const base = known?.scores ?? { ...KIND_SCORES[kind], margin }
  const scores: ChecklistScores = { ...base, margin }
  const composite = average(scores)
  const verdict = decideVerdict(kind, scores, composite)
  const masters = known?.masters ?? composeMasters(stock, kind, scores, pe)
  const inversion = known?.inversion ?? KIND_INVERSION[kind]
  return {
    verdict,
    richness: known || (pe !== null && stock.industry) ? 'B' : 'C',
    composite,
    scores,
    masters,
    inversion,
    strategy: strategyCopy(verdict, stock),
    limit: limitCopy(stock, pe),
  }
}

export function starBar(score: number): string {
  const full = Math.max(0, Math.min(5, Math.round(score)))
  return `${'★'.repeat(full)}${'☆'.repeat(5 - full)}`
}

function matchKnown(stock: QuoteItem): KnownSkill | null {
  const code = stock.code.trim().toUpperCase().replace(/^0+(\d+)$/, '$1')
  const name = stock.name.trim().toLowerCase()
  return (
    KNOWN.find(
      (item) =>
        item.codes.some((c) => c.trim().toUpperCase().replace(/^0+(\d+)$/, '$1') === code) ||
        item.names.some((n) => name.includes(n.toLowerCase()) || n.toLowerCase().includes(name)),
    ) ?? null
  )
}

function blendMargin(base: number | undefined, pe: number | null): number {
  const fromPe = marginFromPe(pe)
  if (base === undefined) return fromPe
  return clamp(Math.round((base * 2 + fromPe) / 3))
}

function marginFromPe(pe: number | null): number {
  if (pe === null) return 3
  if (pe < 0) return 1
  if (pe < 12) return 5
  if (pe < 18) return 4
  if (pe < 28) return 3
  if (pe < 45) return 2
  return 1
}

function average(scores: ChecklistScores): number {
  const v = (scores.circle + scores.business + scores.moat + scores.management + scores.margin) / 5
  return Math.round(v * 10) / 10
}

function decideVerdict(kind: BusinessKind, scores: ChecklistScores, composite: number): GateVerdict {
  if (kind === 'futures') return 'reject'
  if (scores.circle <= 2 && scores.margin <= 2) return 'reject'
  if (composite >= 4.5 && scores.margin >= 3) return 'pass'
  if (composite >= 4) return 'conditional'
  if (composite >= 3.3) return 'gray'
  return 'reject'
}

function composeMasters(
  stock: QuoteItem,
  kind: BusinessKind,
  scores: ChecklistScores,
  pe: number | null,
): MasterRow[] {
  const name = stock.name
  const peBit = pe !== null && pe > 0 ? `盘口约 ${pe.toFixed(0)} 倍市盈率。` : '盘口缺少可用市盈率。'
  return [
    {
      author: '巴菲特',
      score: round1((scores.moat + scores.margin) / 2),
      take: `${name}先问能不能变成可预测的业主收益。${peBit}`,
      question: '10年后护城河还在吗？',
    },
    {
      author: '芒格',
      score: round1((scores.circle + scores.moat) / 2),
      take: KIND_INVERSION[kind],
      question: '我最可能在哪里犯错？',
    },
    {
      author: '段永平',
      score: round1((scores.business + scores.margin) / 2),
      take: `先判断是不是对的生意，再谈对的价格。${name}目前更像「${kindLabel(kind)}」。`,
      question: '关市5年你愿意持有吗？',
    },
    {
      author: '李录',
      score: round1((scores.business + scores.circle) / 2),
      take: '趋势可以对，公司仍可能是3Com。十年确定性来自生意本质，不是资料厚度。',
      question: '20年后回看，它是标准石油还是3Com？',
    },
  ]
}

function kindLabel(kind: BusinessKind): string {
  const map: Record<BusinessKind, string> = {
    'consumer-franchise': '消费特许经营权候选',
    bank: '杠杆化金融机构',
    insurance: '浮存金生意',
    platform: '平台/网络效应生意',
    semiconductor: '高迭代制造',
    'ev-battery': '资本密集制造',
    commodity: '商品周期生意',
    auto: '整车制造',
    solar: '商品化制造',
    pharma: '研发/政策定价生意',
    telecom: '牌照型收费桥梁',
    utility: '监管回报生意',
    realty: '杠杆资产生意',
    manufacturing: '可复制制造',
    futures: '合约而非企业',
    unknown: '尚未归类的生意',
  }
  return map[kind]
}

function strategyCopy(verdict: GateVerdict, stock: QuoteItem): { empty: string; holder: string } {
  const name = stock.name
  if (verdict === 'pass') {
    return {
      empty: `空仓者：生意质量过关，但仍要用财报验证安全边际后再考虑分批。`,
      holder: `持仓者：继续持有的前提是护城河没有变窄；卖出信号是定价权或诚信被破坏，而不是股价波动。`,
    }
  }
  if (verdict === 'conditional') {
    return {
      empty: `空仓者：先放观察名单。缺年报交叉验证，不在当前盘口上编造买入区间。`,
      holder: `持仓者：仓位与「看不懂的部分」成反比。加仓信号必须是生意变好，不是只是更便宜。`,
    }
  }
  if (verdict === 'gray') {
    return {
      empty: `空仓者：灰色地带默认不买。${name}还没有通过「5句话说清」的镜子测试。`,
      holder: `持仓者：不要用补仓证明自己是对的。先补信息，再谈动作。`,
    }
  }
  return {
    empty: `空仓者：不通过。路过是纪律。`,
    holder: `持仓者：重新检查当初买入的前提是否还在；前提没了就该处理。`,
  }
}

function limitCopy(stock: QuoteItem, pe: number | null): string {
  const bits = [
    '仅有盘口快照，没有年报双源交叉验证，不做内在价值区间。',
    'AI 分析置信度低，不等于生意一定差。',
  ]
  if (pe === null) bits.push('缺少可用市盈率，安全边际一栏置信度更低。')
  if (!stock.industry) bits.push('行业字段缺失，能力圈与护城河评分偏框架默认值。')
  return bits.join('')
}

function round1(n: number): number {
  return Math.round(clamp(n) * 10) / 10
}

function clamp(n: number): number {
  return Math.max(1, Math.min(5, n))
}
