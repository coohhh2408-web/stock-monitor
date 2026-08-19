import { inferBusinessKind, type BusinessKind } from '@/services/buffettMunger'
import { getStockPe } from '@/services/sagePlan'
import type { QuoteItem } from '@/types/market'

export type GateAnswer = 'yes' | 'no' | 'unknown'
export type InfoRichness = 'B' | 'C'
export type SkillFilter = 'continue' | 'price-only' | 'skip'

export interface SkillGate {
  id: number
  dimension: string
  question: string
  answer: GateAnswer
  note: string
}

export interface ValueSkillRun {
  richness: InfoRichness
  filter: SkillFilter
  filterNote: string
  yesCount: number
  noCount: number
  unknownCount: number
  qualityNoCount: number
  gates: SkillGate[]
  nextDataNeeded: string[]
  knownProfile: boolean
}

interface QualNotes {
  codes: string[]
  names: string[]
  circle: string
  durable: GateAnswer
  durableNote: string
  moat: GateAnswer
  moatNote: string
  pricePower: GateAnswer
  pricePowerNote: string
}

/** 白名单只填 Q1–Q4 的产品内置说明。Q5–Q7 仍然未知。 */
const KNOWN_QUAL: QualNotes[] = [
  {
    codes: ['600519'],
    names: ['贵州茅台', '茅台'],
    circle: '内置说明：品牌即定价权，消费者为身份支付溢价。非正式年报阅读。',
    durable: 'yes',
    durableNote: '内置说明：特许经营权可穿越周期，前提是批价与渠道健康。',
    moat: 'yes',
    moatNote: '内置说明：护城河来自文化与时间，不是资本开支竞赛。',
    pricePower: 'yes',
    pricePowerNote: '内置说明：社交与身份溢价，通常能维持提价空间。',
  },
  {
    codes: ['000858', '000568'],
    names: ['五粮液', '泸州老窖'],
    circle: '内置说明：高端白酒定价权生意，品牌厚度通常弱于茅台。',
    durable: 'yes',
    durableNote: '内置说明：品类可长存，次品牌更容易陷入库存周期。',
    moat: 'yes',
    moatNote: '内置说明：有特许经营权，但比茅台更薄。',
    pricePower: 'unknown',
    pricePowerNote: '内置说明未覆盖提价纪律，盘口也没有提价记录。',
  },
  {
    codes: ['AAPL'],
    names: ['苹果', 'apple'],
    circle: '内置说明：消费特许经营权，服务收入把硬件变成更像年金的现金。',
    durable: 'yes',
    durableNote: '内置说明：用户转换成本高，工作流与身份绑定。',
    moat: 'yes',
    moatNote: '内置说明：生态锁定，不是芯片周期故事。',
    pricePower: 'yes',
    pricePowerNote: '内置说明：客户愿年复一年付钱；是否已付全款是另一问。',
  },
  {
    codes: ['KO', 'PEP'],
    names: ['可口可乐', '百事'],
    circle: '内置说明：全球品牌、习惯性消费、低资本开支。',
    durable: 'yes',
    durableNote: '内置说明：人们仍会为愉悦支付一点点溢价。',
    moat: 'yes',
    moatNote: '内置说明：教科书级饮料特许经营权。',
    pricePower: 'yes',
    pricePowerNote: '内置说明：风险通常不在产品，而在为成长付出的价格。',
  },
  {
    codes: ['300750'],
    names: ['宁德时代'],
    circle: '内置说明：动力电池制造龙头，市占率靠持续再投资维持。',
    durable: 'unknown',
    durableNote: '技术迭代与扩产竞赛，十年竞争力没有年报证据。',
    moat: 'no',
    moatNote: '内置说明：资本密集，客户可扶持第二供应商，优势可被复制。',
    pricePower: 'no',
    pricePowerNote: '内置说明：车企议价强，超额利润容易被竞争吃掉。',
  },
  {
    codes: ['NVDA'],
    names: ['英伟达', 'nvidia'],
    circle: '内置说明：算力芯片。五年竞争格局不在本产品已理解范围。',
    durable: 'unknown',
    durableNote: '下一代架构谁赢，盘口无法回答。',
    moat: 'yes',
    moatNote: '内置说明：软件栈与生态有转换成本；仍可能被下一代改写。',
    pricePower: 'unknown',
    pricePowerNote: '没有提价或份额证据，只有行情倍数。',
  },
  {
    codes: ['TSLA'],
    names: ['特斯拉', 'tesla'],
    circle: '内置说明：整车制造加软件叙事。',
    durable: 'unknown',
    durableNote: '必须持续证明自己，十年竞争力未知。',
    moat: 'no',
    moatNote: '内置说明：汽车制造优势可被资本与产能追上。',
    pricePower: 'no',
    pricePowerNote: '内置说明：价格战会吞噬利润。',
  },
  {
    codes: ['002594'],
    names: ['比亚迪'],
    circle: '内置说明：垂直整合的整车与电池制造。',
    durable: 'unknown',
    durableNote: '周期底部能否产生现金，本页没有年报。',
    moat: 'unknown',
    moatNote: '成本能力需周期验证，不是已证实的特许经营权。',
    pricePower: 'no',
    pricePowerNote: '内置说明：汽车价格竞争残酷。',
  },
  {
    codes: ['MSFT'],
    names: ['微软', 'microsoft'],
    circle: '内置说明：办公软件与云，经常性收入接近特许经营权。',
    durable: 'yes',
    durableNote: '内置说明：客户锁在工作流里。',
    moat: 'yes',
    moatNote: '内置说明：转换成本高。',
    pricePower: 'yes',
    pricePowerNote: '内置说明：可理解的科技生意；价格是否透支另算。',
  },
  {
    codes: ['AMZN'],
    names: ['亚马逊', 'amazon'],
    circle: '内置说明：零售薄利再投资，AWS 更像特许经营权。',
    durable: 'yes',
    durableNote: '内置说明：再投资加深护城河，单位经济需分开看。',
    moat: 'yes',
    moatNote: '内置说明：规模与云的转换成本。',
    pricePower: 'unknown',
    pricePowerNote: '零售端提价空间本页无法验证。',
  },
  {
    codes: ['META'],
    names: ['meta', 'facebook', '脸书'],
    circle: '内置说明：注意力网络上的广告生意。',
    durable: 'unknown',
    durableNote: '下一代用户还是否打开，盘口不能答。',
    moat: 'yes',
    moatNote: '内置说明：网络效应是真的。',
    pricePower: 'yes',
    pricePowerNote: '内置说明：广告变现有定价权，监管与注意力迁移是另一层风险。',
  },
  {
    codes: ['00700', '0700'],
    names: ['腾讯控股', '腾讯'],
    circle: '内置说明：社交与支付网络，游戏提供现金。',
    durable: 'yes',
    durableNote: '内置说明：网络效应可长存；监管是情景风险。',
    moat: 'yes',
    moatNote: '内置说明：社交与支付是真护城河。',
    pricePower: 'yes',
    pricePowerNote: '内置说明：不要为生态想象支付无限价格。',
  },
  {
    codes: ['03690', '3690'],
    names: ['美团'],
    circle: '内置说明：本地生活履约平台。',
    durable: 'unknown',
    durableNote: '补贴与竞争格局变化快，十年竞争力未知。',
    moat: 'unknown',
    moatNote: '有网络效应，也容易变成补贴战。',
    pricePower: 'no',
    pricePowerNote: '内置说明：履约成本高，提价空间受竞争约束。',
  },
  {
    codes: ['600036'],
    names: ['招商银行'],
    circle: '内置说明：零售与财富管理更接近特许经营权的银行。',
    durable: 'yes',
    durableNote: '内置说明：好银行可长存，仍要为信贷周期留余地。',
    moat: 'yes',
    moatNote: '内置说明：存款质量与文化，不是规模。',
    pricePower: 'unknown',
    pricePowerNote: '利率与费率受周期和监管约束，本页无证据。',
  },
  {
    codes: ['601318'],
    names: ['中国平安'],
    circle: '内置说明：综合金融，利润来源多，风险也更难一眼看穿。',
    durable: 'unknown',
    durableNote: '承保与投资端纪律需要年报，盘口不够。',
    moat: 'unknown',
    moatNote: '浮存金可以是优势，也可以是复杂。',
    pricePower: 'unknown',
    pricePowerNote: '没有承保定价证据。',
  },
  {
    codes: ['601012'],
    names: ['隆基绿能', '隆基'],
    circle: '内置说明：光伏制造，产能扩张快、价格战残酷。',
    durable: 'no',
    durableNote: '内置说明：昨天的成本优势明天可能消失。',
    moat: 'no',
    moatNote: '内置说明：商品制造，优势可被新产能复制。',
    pricePower: 'no',
    pricePowerNote: '内置说明：价格由产能周期决定。',
  },
  {
    codes: ['603993'],
    names: ['洛阳钼业'],
    circle: '内置说明：矿业，命运由金属价格决定。',
    durable: 'no',
    durableNote: '内置说明：没有定价权的生意，竞争力随周期摆。',
    moat: 'no',
    moatNote: '内置说明：商品价格不是护城河。',
    pricePower: 'no',
    pricePowerNote: '内置说明：无法对金属提价。',
  },
  {
    codes: ['002938', '002475', '601138', '002241', '300433'],
    names: ['鹏鼎控股', '立讯精密', '工业富联', '歌尔股份', '蓝思科技'],
    circle: '内置说明：消费电子制造，依赖大客户订单。',
    durable: 'unknown',
    durableNote: '客户集中，离开单一客户后生意剩多少未知。',
    moat: 'no',
    moatNote: '内置说明：效率可被复制，客户可切换。',
    pricePower: 'no',
    pricePowerNote: '内置说明：毛利率受大客户压制。',
  },
]

const GATES_META: { id: number; dimension: string; question: string }[] = [
  { id: 1, dimension: '能力圈', question: '能用一段话讲清这门生意怎么赚钱吗？' },
  { id: 2, dimension: '耐久', question: '十年后这门生意是否仍更有竞争力？' },
  { id: 3, dimension: '护城河', question: '核心优势是否难以被复制？' },
  { id: 4, dimension: '定价权', question: '少损失客户的前提下，能否提价？' },
  { id: 5, dimension: '赚钱质量', question: '利润是否真能变成现金？' },
  { id: 6, dimension: '负债安全', question: '行业最差情景下能否活下来？' },
  { id: 7, dimension: '管理层', question: '管理层是否直面问题，而不是藏着？' },
  { id: 8, dimension: '价格', question: '现价是否进入该生意类型的习惯买点带？' },
]

export function runValueSkill(stock: QuoteItem, kindLabel: string, inBand: boolean | null): ValueSkillRun {
  const kind = inferBusinessKind(stock)
  const known = matchKnownQual(stock)
  const peNow = getStockPe(stock)

  const q1 = gateCircle(kind, known, kindLabel)
  const q2 = known
    ? pack(2, known.durable, known.durableNote)
    : pack(2, 'unknown', '没有十年竞争力证据。暂归类不是预测。')
  const q3 = known
    ? pack(3, known.moat, known.moatNote)
    : pack(3, 'unknown', '盘口没有护城河证据。')
  const q4 = known
    ? pack(4, known.pricePower, known.pricePowerNote)
    : pack(4, 'unknown', '没有提价记录。')
  const q5 = pack(5, 'unknown', '盘口没有现金流，不算赚钱质量。')
  const q6 = pack(6, 'unknown', '盘口没有负债，不做最差情景。')
  const q7 = pack(7, 'unknown', '没有治理或诚信记录。未知不能当成否决。')
  const q8 = gatePrice(peNow, inBand, kind)

  const gates = [q1, q2, q3, q4, q5, q6, q7, q8]
  const yesCount = gates.filter((g) => g.answer === 'yes').length
  const noCount = gates.filter((g) => g.answer === 'no').length
  const unknownCount = gates.filter((g) => g.answer === 'unknown').length
  const qualityNoCount = gates.filter((g) => g.id <= 7 && g.answer === 'no').length
  const integrityFail = q7.answer === 'no'

  const richness: InfoRichness = known && peNow !== null ? 'B' : 'C'
  let filter: SkillFilter = 'price-only'
  let filterNote = `未知 ${unknownCount} 项。本页只能算习惯买点，不能当研究结论。`

  if (kind === 'futures' || integrityFail || qualityNoCount >= 4) {
    filter = 'skip'
    filterNote = integrityFail
      ? '管理层关未过关，一票否决。'
      : '这不是可以按企业清单定价的标的，或不满足质量关。'
  } else if (unknownCount < 4 && known) {
    filter = 'continue'
    filterNote = '质量关仍有未知。内置说明可以辅助理解，不能代替年报。'
  }

  return {
    richness,
    filter,
    filterNote,
    yesCount,
    noCount,
    unknownCount,
    qualityNoCount,
    gates,
    knownProfile: Boolean(known),
    nextDataNeeded: [
      '年报或交易所披露的自由现金流',
      '负债与利息保障',
      '管理层诚信与资本配置记录',
      '第二独立数据源（信息级才能到 A）',
    ],
  }
}

export function answerLabel(answer: GateAnswer): string {
  if (answer === 'yes') return '成立'
  if (answer === 'no') return '未过关'
  return '未知'
}

function gateCircle(kind: BusinessKind, known: QualNotes | null, kindLabel: string): SkillGate {
  if (kind === 'futures') {
    return pack(1, 'no', '买的是合约，不是可以讲清的企业。')
  }
  if (known) return pack(1, 'yes', known.circle)
  if (kind === 'unknown') {
    return pack(1, 'unknown', '名称和行业都不够归类，谈不上能力圈。')
  }
  return pack(1, 'unknown', `按名称暂归为「${kindLabel}」，不是已读年报。`)
}

function gatePrice(peNow: number | null, inBand: boolean | null, kind: BusinessKind): SkillGate {
  if (kind === 'futures') return pack(8, 'no', '不适用市盈率定价。')
  if (peNow === null || inBand === null) return pack(8, 'unknown', '缺市盈率，先不判断买点。')
  if (inBand) return pack(8, 'yes', `当前约 ${peNow.toFixed(0)} 倍，落在习惯买点带内。倍数到了 ≠ 该买。`)
  return pack(8, 'no', `当前约 ${peNow.toFixed(0)} 倍，尚未进入习惯买点带。`)
}

function pack(id: number, answer: GateAnswer, note: string): SkillGate {
  const meta = GATES_META[id - 1]
  return { ...meta, answer, note }
}

function matchKnownQual(stock: QuoteItem): QualNotes | null {
  const code = normalizeCode(stock.code)
  const name = stock.name.trim().toLowerCase()
  return (
    KNOWN_QUAL.find(
      (item) =>
        item.codes.some((c) => normalizeCode(c) === code) ||
        item.names.some((n) => name.includes(n.toLowerCase()) || n.toLowerCase().includes(name)),
    ) ?? null
  )
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/^0+(\d+)$/, '$1')
}
