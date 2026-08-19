import { buildSagePlan, type SagePlan } from '@/services/sagePlan'
import type { QuoteItem } from '@/types/market'

export type ValueStance = 'constructive' | 'cautious' | 'skeptical'

export interface SageTake {
  author: '巴菲特' | '芒格' | '段永平'
  lens: string
  stance: ValueStance
  summary: string
  plan: SagePlan
}

export interface BuffettMungerBrief {
  buffett: SageTake
  munger: SageTake
  duan: SageTake
}

export type BusinessKind =
  | 'consumer-franchise'
  | 'bank'
  | 'insurance'
  | 'platform'
  | 'semiconductor'
  | 'ev-battery'
  | 'commodity'
  | 'auto'
  | 'solar'
  | 'pharma'
  | 'telecom'
  | 'utility'
  | 'realty'
  | 'manufacturing'
  | 'futures'
  | 'unknown'

interface KnownProfile {
  codes: string[]
  names: string[]
  kind: BusinessKind
  buffett: string
  munger: string
  buffettStance: ValueStance
  mungerStance: ValueStance
}

const KNOWN: KnownProfile[] = [
  {
    codes: ['600519'],
    names: ['贵州茅台', '茅台'],
    kind: 'consumer-franchise',
    buffettStance: 'constructive',
    mungerStance: 'constructive',
    buffett:
      '这是典型的「喜诗糖果」生意：品牌即定价权。消费者为社交与身份支付溢价，几乎不需要持续大额再投资就能把利润变成现金。只要批价与渠道库存健康，特许经营权就能穿越周期。',
    munger:
      '好生意的第一原则是别做蠢事。茅台的护城河来自文化与时间，不是资本开支竞赛。真正要担心的是把过剩现金乱花，以及把奢侈品当周期股追涨杀跌。',
  },
  {
    codes: ['000858', '000568'],
    names: ['五粮液', '泸州老窖'],
    kind: 'consumer-franchise',
    buffettStance: 'constructive',
    mungerStance: 'cautious',
    buffett:
      '高端白酒仍是定价权生意，只是品牌厚度通常弱于茅台。能看自由现金流与渠道健康，而不是看短期批价情绪。第二名可以很好，但安全边际要更厚。',
    munger:
      '别把「也是白酒」当成相同质量。次品牌更容易陷入价格战与库存周期。买特许经营权，不要买行业贝塔。',
  },
  {
    codes: ['AAPL'],
    names: ['苹果', 'apple'],
    kind: 'consumer-franchise',
    buffettStance: 'constructive',
    mungerStance: 'constructive',
    buffett:
      '苹果首先是消费特许经营权，不是芯片公司。用户转换成本极高，服务收入把一次性硬件销售变成更像年金的现金流。大额回购说明管理层懂资本配置——这正是重仓的逻辑。',
    munger:
      '简单、高回报、有定价权。别被「科技股」标签吓跑；真正重要的是客户愿不愿意年复一年付钱，以及现金有没有回到股东手里。',
  },
  {
    codes: ['KO', 'PEP'],
    names: ['可口可乐', '百事'],
    kind: 'consumer-franchise',
    buffettStance: 'constructive',
    mungerStance: 'constructive',
    buffett:
      '全球品牌、习惯性消费、低资本开支，这是教科书级的现金奶牛。不需要预测明年口味，只需要相信人们仍会为愉悦支付一点点溢价。',
    munger:
      '能看懂的生意才值得拥有一辈子。饮料特许经营权的风险通常不在产品，而在你为成长故事付出的价格。',
  },
  {
    codes: ['300750'],
    names: ['宁德时代'],
    kind: 'ev-battery',
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett:
      '全球龙头值得尊重，但动力电池是资本密集、技术迭代快的行业，很难形成可预测的十年业主收益。市占率领先不等于可以「坐着收钱」，护城河取决于持续砸钱。',
    munger:
      '别把成长叙事当成确定性。车企扶持第二供应商时，超额利润会被竞争吃掉。能看懂单位经济再谈估值；看不懂就放过，这不是失败。',
  },
  {
    codes: ['NVDA'],
    names: ['英伟达', 'nvidia'],
    kind: 'semiconductor',
    buffettStance: 'skeptical',
    mungerStance: 'cautious',
    buffett:
      '这可能是伟大的生意，但不在我习惯的能力圈中心。技术变迁太快，今天的垄断可能被下一代架构改写。若看不懂五年后的竞争格局，再亮眼的增长也没有安全边际。',
    munger:
      '高质量公司可以承受更高估值，但价格仍是纪律。当市场把所有乐观假设都贴现进股价时，错误的代价是永久性资本损失，而不是少赚一段。',
  },
  {
    codes: ['TSLA'],
    names: ['特斯拉', 'tesla'],
    kind: 'auto',
    buffettStance: 'skeptical',
    mungerStance: 'skeptical',
    buffett:
      '我不投资需要不断证明自己的故事股。汽车制造历史上股东回报平庸，若估值却按软件公司定价，安全边际通常不够。',
    munger:
      '避免与「必须永远完美执行」的标的共舞。能颠覆行业，不等于能以合理价格买到可预测的业主收益。',
  },
  {
    codes: ['002594'],
    names: ['比亚迪'],
    kind: 'auto',
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett:
      '垂直整合与成本能力令人印象深刻，但汽车仍是资本开支大、价格竞争残酷的行业。伟大的工厂不等于伟大的股东回报，要看周期底部仍能否产生现金。',
    munger:
      '倒过来想：若补贴退坡、价格战持续，剩余利润归谁？能活下来的企业值得研究，但研究不等于现在就该按乐观假设下注。',
  },
  {
    codes: ['MSFT'],
    names: ['微软', 'microsoft'],
    kind: 'platform',
    buffettStance: 'constructive',
    mungerStance: 'constructive',
    buffett:
      '办公软件与云服务把客户锁进工作流，转换成本极高，经常性收入接近特许经营权。这是少数我愿意称为「可理解的科技」的生意。',
    munger:
      '最好的投资往往是对显而易见事实的耐心持有。先问价格是否已经透支了云与 AI 的全部乐观，再谈质量。',
  },
  {
    codes: ['AMZN'],
    names: ['亚马逊', 'amazon'],
    kind: 'platform',
    buffettStance: 'cautious',
    mungerStance: 'constructive',
    buffett:
      '零售端利润薄、再投资欲望极强，AWS 才是更像特许经营权的部分。我曾因报表难看而错过它，教训是：要看单位经济与再投资回报，而不是短期净利率。',
    munger:
      '愿意牺牲账面利润去加深护城河的管理层很少见。关键仍是：你为这段旅程付出的价格，有没有留下容错空间。',
  },
  {
    codes: ['META'],
    names: ['meta', 'facebook', '脸书'],
    kind: 'platform',
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett:
      '注意力网络效应是真的，广告生意可以很赚钱。但我需要确信监管、隐私与注意力迁移不会在十年尺度上侵蚀业主收益。',
    munger:
      '社交产品可以极好，也可以极快过时。能力圈的边界就是：你是否真能判断下一代用户还会不会打开这个应用。',
  },
  {
    codes: ['00700', '0700'],
    names: ['腾讯控股', '腾讯'],
    kind: 'platform',
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett:
      '社交与支付的网络效应是真护城河，游戏提供现金。但监管变量与庞大的投资组合让未来业主收益更难算清——看不懂的部分越大，仓位就该越小。',
    munger:
      '平台生意可以很棒，前提是别为「生态想象」支付无限价格。倒过来想：若流量红利结束，剩下的是什么？',
  },
  {
    codes: ['03690', '3690'],
    names: ['美团'],
    kind: 'platform',
    buffettStance: 'cautious',
    mungerStance: 'skeptical',
    buffett:
      '本地生活有网络效应，但履约成本高、竞争容易变成补贴战。我更想看到可持续的自由现金流，而不是GMV叙事。',
    munger:
      '烧钱换规模常常是在训练用户更不忠诚。先证明单位经济，再谈护城河，顺序反了就会永久亏损。',
  },
  {
    codes: ['600036'],
    names: ['招商银行'],
    kind: 'bank',
    buffettStance: 'constructive',
    mungerStance: 'cautious',
    buffett:
      '好银行是杠杆化的信任机器。零售与财富管理比拼规模的对公行更接近特许经营权，但仍必须为信贷周期预留余地。',
    munger:
      '金融股最大的风险是自以为懂。杠杆让平庸的错误变成灾难，所以只考虑文化保守、不靠旁氏扩张的银行。',
  },
  {
    codes: ['601318'],
    names: ['中国平安'],
    kind: 'insurance',
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett:
      '保险浮存金可以是绝佳资本，前提是承保纪律与投资端都不作死。综合金融让利润来源变多，也让风险更难一眼看穿。',
    munger:
      '复杂是欺诈与误判的温床。看不懂浮存金如何被使用，就不要被「估值便宜」吸引。',
  },
  {
    codes: ['601012'],
    names: ['隆基绿能', '隆基'],
    kind: 'solar',
    buffettStance: 'skeptical',
    mungerStance: 'skeptical',
    buffett:
      '光伏是典型的商品制造：产能扩张快、价格战残酷，昨天的成本优势明天就消失。我很少在这类行业找到可预测的十年现金。',
    munger:
      '当所有人都在扩产时，聪明的问题是谁会亏掉资本。技术路线变化会把账面资产变成沉没成本。',
  },
  {
    codes: ['603993'],
    names: ['洛阳钼业'],
    kind: 'commodity',
    buffettStance: 'skeptical',
    mungerStance: 'cautious',
    buffett:
      '矿业的命运由金属价格决定，而不是由管理层的愿望决定。没有定价权的生意，再便宜也可能只是雪茄烟蒂。',
    munger:
      '周期股能赚钱，但你必须在别人贪婪时克制。把商品价格当护城河，是最常见的认知错误。',
  },
  {
    codes: ['002938', '002475', '601138', '002241', '300433'],
    names: ['鹏鼎控股', '立讯精密', '工业富联', '歌尔股份', '蓝思科技'],
    kind: 'manufacturing',
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett:
      '消费电子制造依赖大客户订单，毛利率受压、资本开支不低。能做到极致效率值得尊敬，但客户集中度让业主收益并不稳固。',
    munger:
      '给巨人打工可以活得很好，却很难拥有巨人的回报。先问：离开单一客户后，生意还剩下什么？',
  },
]

const DUAN_BY_CODE: Record<string, { stance: ValueStance; summary: string }> = {
  '600519': {
    stance: 'cautious',
    summary:
      '对的生意没问题：卖身份认同的高毛利消费品。但好生意被追高，就不是对的价格。本分是等，不是因为是茅台就现在买。',
  },
  '000858': {
    stance: 'cautious',
    summary: '也是白酒，但不等于茅台。对的生意要更挑剔，对的价格要更便宜。看不清批价和库存就先不动。',
  },
  '000568': {
    stance: 'cautious',
    summary: '也是白酒，但不等于茅台。对的生意要更挑剔，对的价格要更便宜。看不清批价和库存就先不动。',
  },
  AAPL: {
    stance: 'constructive',
    summary: '这是对的生意，用户愿意年复一年付钱。下一步不是追涨，是有现金了按纪律加，没有对的价格就不加。',
  },
  KO: {
    stance: 'constructive',
    summary: '能看懂的消费品。别把「熟悉」当成可以任意价格买入。对的价格出现了再买。',
  },
  PEP: {
    stance: 'constructive',
    summary: '能看懂的消费品。别把「熟悉」当成可以任意价格买入。对的价格出现了再买。',
  },
  '300750': {
    stance: 'skeptical',
    summary: '技术迭代太快，不是我的本分。看不懂五年后护城河在哪，仓位就该是 0。',
  },
  NVDA: {
    stance: 'skeptical',
    summary: '好公司不等于现在就该买。看不懂谁会赢下一代，就不要硬懂。本分是放过。',
  },
  TSLA: {
    stance: 'skeptical',
    summary: '故事太满。不是对的价格，也很难算成对的生意。不碰。',
  },
  '002594': {
    stance: 'cautious',
    summary: '能造车值得尊重，但汽车生意很难。没到对的价格之前，研究不等于要买。',
  },
  MSFT: {
    stance: 'cautious',
    summary: '对的生意。云和办公能看懂。现在是不是对的价格，要另算；不对就不加。',
  },
  AMZN: {
    stance: 'cautious',
    summary: '零售薄利、AWS 才像好生意。报表难看也可以，价格不对就等。',
  },
  META: {
    stance: 'cautious',
    summary: '社交可以很好，也可以很快过时。看不清下一代还用不用，就不要重仓。',
  },
  '00700': {
    stance: 'cautious',
    summary: '社交和游戏是能看懂的生意。生态故事先放一边，价格不对就不动。',
  },
  '03690': {
    stance: 'skeptical',
    summary: '单位经济没看清之前，规模不是护城河。本分是 0 仓位。',
  },
  '600036': {
    stance: 'cautious',
    summary: '银行要保守。文化不对或价格不对，都不买。便宜了再谈。',
  },
  '601318': {
    stance: 'skeptical',
    summary: '综合金融太复杂。看不懂浮存金怎么用，就当不是对的生意。',
  },
  '601012': {
    stance: 'skeptical',
    summary: '光伏拼产能，不是对的生意。本分是避开资本开支竞赛。',
  },
  '603993': {
    stance: 'skeptical',
    summary: '商品价格不是护城河。周期股可以研究，但很少是对的生意。',
  },
  '002938': {
    stance: 'cautious',
    summary: '给巨人打工可以活，但很难成为对的生意。客户一走，故事就没了。',
  },
}

const DUAN_KIND: Record<BusinessKind, { stance: ValueStance; line: (name: string, valuation: string) => string }> = {
  'consumer-franchise': {
    stance: 'cautious',
    line: (name, valuation) =>
      `${name}若真是重复购买的好品牌，就是对的生意。下一步只问今天是不是对的价格。${valuation}好公司也可以等。`,
  },
  bank: {
    stance: 'cautious',
    line: (name, valuation) => `银行不是不能买，但必须保守。${name}文化看不清就放过。${valuation}`,
  },
  insurance: {
    stance: 'skeptical',
    line: (name, valuation) => `看不懂浮存金怎么用，就不是对的生意。${name}报表越复杂越要本分。${valuation}`,
  },
  platform: {
    stance: 'cautious',
    line: (name, valuation) => `先问用户为什么付钱，再问是不是靠补贴。${name}单位经济没算清，仓位就是 0。${valuation}`,
  },
  semiconductor: {
    stance: 'skeptical',
    line: (name) => `${name}迭代太快。看不懂就不要装懂，这是本分不是胆小。`,
  },
  'ev-battery': {
    stance: 'skeptical',
    line: (name) => `${name}要靠持续砸钱维持份额。这不像对的生意，价格再便宜也先放。`,
  },
  commodity: {
    stance: 'skeptical',
    line: (name) => `${name}没有定价权。商品周期不是我愿意长期持有的生意。`,
  },
  auto: {
    stance: 'skeptical',
    line: (name) => `汽车很难成为对的生意。${name}再强，也不在「关市五年也安心」的清单里。`,
  },
  solar: {
    stance: 'skeptical',
    line: (name) => `${name}拼产能。这不是对的生意。`,
  },
  pharma: {
    stance: 'skeptical',
    line: (name) => `分子式不是我的本分。${name}看不懂就不买。`,
  },
  telecom: {
    stance: 'cautious',
    line: (name, valuation) => `${name}能看懂，但回报常被封顶。对的价格要更便宜。${valuation}`,
  },
  utility: {
    stance: 'cautious',
    line: (name, valuation) => `${name}无聊是优点。别用成长股的价格去买它。${valuation}`,
  },
  realty: {
    stance: 'skeptical',
    line: (name) => `高杠杆不是本分。${name}看不清负债就不碰。`,
  },
  manufacturing: {
    stance: 'cautious',
    line: (name, valuation) => `${name}可以很勤奋，但不等于对的生意。客户能换，就要更便宜才买。${valuation}`,
  },
  futures: {
    stance: 'skeptical',
    line: (name) => `${name}不是企业。这不叫投资。仓位 0。`,
  },
  unknown: {
    stance: 'cautious',
    line: (name, valuation) => `5 句话说不清${name}为什么赚钱，就先不动。${valuation}本分是等看懂。`,
  },
}

const STANCE_LABEL: Record<ValueStance, string> = {
  constructive: '偏建设性',
  cautious: '审慎观望',
  skeptical: '倾向回避',
}

export function stanceLabel(stance: ValueStance): string {
  return STANCE_LABEL[stance]
}

export function buildBuffettMungerBrief(stock: QuoteItem): BuffettMungerBrief {
  const known = matchKnown(stock)
  if (known) return withValuationOverlay(stock, known)
  return composeFromKind(stock, inferBusinessKind(stock))
}

function matchKnown(stock: QuoteItem): BuffettMungerBrief | null {
  const code = normalizeCode(stock.code)
  const name = stock.name.trim().toLowerCase()
  const hit = KNOWN.find(
    (item) =>
      item.codes.some((c) => normalizeCode(c) === code) ||
      item.names.some((n) => name.includes(n.toLowerCase()) || n.toLowerCase().includes(name)),
  )
  if (!hit) return null
  const duan = DUAN_BY_CODE[hit.codes[0]] ?? DUAN_KIND[hit.kind]
  const duanSummary = 'summary' in duan && duan.summary ? duan.summary : DUAN_KIND[hit.kind].line(stock.name, '')
  return {
    buffett: take('巴菲特', '护城河 · 业主收益 · 安全边际', hit.buffettStance, hit.buffett, stock, hit.kind),
    munger: take('芒格', '逆向思考 · 能力圈 · 避免蠢事', hit.mungerStance, hit.munger, stock, hit.kind),
    duan: take('段永平', '对的生意 · 对的人 · 对的价格', duan.stance, duanSummary, stock, hit.kind),
  }
}

function composeFromKind(stock: QuoteItem, kind: BusinessKind): BuffettMungerBrief {
  const name = stock.name
  const valuation = describeValuation(stock)
  const copy = KIND_COPY[kind](name, valuation, stock)
  const duan = DUAN_KIND[kind]
  return {
    buffett: take('巴菲特', '护城河 · 业主收益 · 安全边际', copy.buffettStance, copy.buffett, stock, kind),
    munger: take('芒格', '逆向思考 · 能力圈 · 避免蠢事', copy.mungerStance, copy.munger, stock, kind),
    duan: take('段永平', '对的生意 · 对的人 · 对的价格', duan.stance, duan.line(name, valuation), stock, kind),
  }
}

function withValuationOverlay(stock: QuoteItem, brief: BuffettMungerBrief): BuffettMungerBrief {
  const note = valuationClause(stock)
  if (!note) return brief
  return {
    buffett: { ...brief.buffett, summary: `${brief.buffett.summary}${note.buffett}` },
    munger: { ...brief.munger, summary: `${brief.munger.summary}${note.munger}` },
    duan: { ...brief.duan, summary: `${brief.duan.summary}${note.duan}` },
  }
}

function take(
  author: SageTake['author'],
  lens: string,
  stance: ValueStance,
  summary: string,
  stock: QuoteItem,
  kind: BusinessKind,
): SageTake {
  const id = author === '巴菲特' ? 'buffett' : author === '芒格' ? 'munger' : 'duan'
  return { author, lens, stance, summary, plan: buildSagePlan(stock, kind, stance, id) }
}

export function inferBusinessKind(stock: QuoteItem): BusinessKind {
  if (stock.market === 'futures') return 'futures'
  const text = `${stock.name} ${stock.industry ?? ''}`.toLowerCase()
  const hit = (keywords: string[]) => keywords.some((k) => text.includes(k.toLowerCase()))

  if (hit(['白酒', '啤酒', '饮料', '食品', '乳', '调味', '消费', '服饰', '化妆品', '中药'])) return 'consumer-franchise'
  if (hit(['银行', '农商', '股份'])) return 'bank'
  if (hit(['保险', '人寿', '财险'])) return 'insurance'
  if (hit(['半导体', '芯片', '集成电路', 'gpu', '光模块', '先进封装', '寒武纪', '中际旭创'])) return 'semiconductor'
  if (hit(['电池', '锂电', '储能'])) return 'ev-battery'
  if (hit(['光伏', '太阳能', '硅料', '风电'])) return 'solar'
  if (hit(['汽车', '整车', '新能源车'])) return 'auto'
  if (hit(['铜', '铝', '锌', '镍', '钼', '锂', '稀土', '煤炭', '石油', '钢铁', '有色'])) return 'commodity'
  if (hit(['地产', '房地产', '物业'])) return 'realty'
  if (hit(['医药', '生物', '疫苗', 'CXO', '医疗'])) return 'pharma'
  if (hit(['运营商', '电信', '移动', '联通', '通信'])) return 'telecom'
  if (hit(['电力', '水电', '核电', '燃气', '水务', '公用'])) return 'utility'
  if (hit(['互联网', '电商', '游戏', '社交', '软件', '云', '平台', '广告'])) return 'platform'
  if (hit(['制造', '电子', '器件', '设备', '机械', '军工', '航空'])) return 'manufacturing'
  return 'unknown'
}

type KindComposer = (
  name: string,
  valuation: string,
  stock: QuoteItem,
) => {
  buffett: string
  munger: string
  buffettStance: ValueStance
  mungerStance: ValueStance
}

const KIND_COPY: Record<BusinessKind, KindComposer> = {
  'consumer-franchise': (name, valuation) => ({
    buffettStance: 'constructive',
    mungerStance: 'constructive',
    buffett: `${name}若真有品牌溢价与重复购买，就接近「特许经营权」：不靠持续大额资本开支也能产生现金。${valuation}关键仍是定价权会不会被渠道或替代品削弱。`,
    munger: `先问这个品牌十年后人们是否还愿意多付钱。消费股最常见的蠢事是把短期动销当成护城河，再为它支付过高价格。`,
  }),
  bank: (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `银行是杠杆化的信任。${name}值不值得拥有，取决于信贷文化与存款质量，而不是规模。${valuation}永远为坏账周期留余地。`,
    munger: `金融股最大的错误是以为自己看懂了。杠杆会把一次误判放大成灾难——只碰管理层保守、不做账的银行。`,
  }),
  insurance: (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `保险的魅力是浮存金，前提是承保不亏、投资端不作死。${name}的报表越复杂，越需要证明纪律。${valuation}`,
    munger: `看不懂浮存金如何被使用，就不要被「低估值」诱惑。复杂是误判的温床。`,
  }),
  platform: (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `平台生意可以有网络效应，也可以只有补贴堆出来的规模。${name}要看经常性现金，而不是用户故事。${valuation}`,
    munger: `倒过来想：若增长停下来，单位经济还剩什么？为「生态」支付无限价格，是当代最流行的蠢事之一。`,
  }),
  semiconductor: (name, valuation) => ({
    buffettStance: 'skeptical',
    mungerStance: 'cautious',
    buffett: `半导体迭代太快，很少符合「可预测十年业主收益」的标准。${name}也许很优秀，但若不在能力圈内，再好也不该硬懂。${valuation}`,
    munger: `能力圈的边界要画清楚。看不懂下一代制程或架构谁赢，就把「错过」当成纪律，而不是遗憾。`,
  }),
  'ev-battery': (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `电池与新能源制造资本开支高、客户议价强。${name}的市占率需要持续再投资来维持，这不是坐着收钱的生意。${valuation}`,
    munger: `当所有人都在扩产时，超额利润通常是暂时的。先看资本回报会不会被竞争打回均值。`,
  }),
  commodity: (name, valuation) => ({
    buffettStance: 'skeptical',
    mungerStance: 'cautious',
    buffett: `${name}这类商品生意几乎没有定价权，利润由价格周期决定。我更愿在别人恐惧时捡烟蒂，而不是在景气顶点谈论成长。${valuation}`,
    munger: `把商品价格当护城河是常见错觉。周期股能赚，但必须承认自己是在做均值回归，不是在买永续特权。`,
  }),
  auto: (name, valuation) => ({
    buffettStance: 'skeptical',
    mungerStance: 'skeptical',
    buffett: `整车制造历史上股东回报平庸：重资产、强周期、价格战。${name}要证明周期底部仍能产生现金，而不是只在交付高潮时好看。${valuation}`,
    munger: `能把车造得更好，不等于投资人能得到更好的复利。对必须完美执行才能证明估值的公司，默认说不。`,
  }),
  solar: (name, valuation) => ({
    buffettStance: 'skeptical',
    mungerStance: 'skeptical',
    buffett: `光伏是商品制造加强版：产能扩张快，成本优势易逝。${name}今天的利润，明天可能被新产能抹平。${valuation}`,
    munger: `技术路线一变，账面产能就是沉没成本。这不是适合「买入并永远持有」的行业。`,
  }),
  pharma: (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `医药可以有专利护城河，也可以有管线归零。${name}若利润依赖单一品种或政策定价，可预测性就会差很多。${valuation}`,
    munger: `先承认自己不懂分子式。买药企是在买管理层的资本配置与研发纪律，不是在买故事。`,
  }),
  telecom: (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'constructive',
    buffett: `电信有牌照壁垒，但资本开支与监管回报会把超额利润削平。${name}更像收费桥梁：稳定，却很难惊喜。${valuation}`,
    munger: `无聊有时是优点。能产生现金、又不容易突然死亡的生意，值得用合理价格慢慢买。`,
  }),
  utility: (name, valuation) => ({
    buffettStance: 'constructive',
    mungerStance: 'constructive',
    buffett: `公用事业可预测，但回报常被监管封顶。${name}适合作为理解得了的现金资产，而不是奇迹成长股。${valuation}`,
    munger: `别为公用事业支付成长股估值。稳定本身已经是优势，再叠加高预期就是在自找麻烦。`,
  }),
  realty: (name, valuation) => ({
    buffettStance: 'skeptical',
    mungerStance: 'skeptical',
    buffett: `房地产依赖杠杆与土地价格，现金流在周期里可以突然消失。${name}若看不清负债与去化，就没有安全边际。${valuation}`,
    munger: `用高杠杆去赌资产价格，是最容易看起来聪明、最终很蠢的做法。能避开的风险就该避开。`,
  }),
  manufacturing: (name, valuation) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `制造业的护城河通常薄：客户能换供应商，产能也能被复制。${name}要看资本回报是否持续高于平均，而不是看某一年景气。${valuation}`,
    munger: `没有定价权就只能靠勤奋。勤奋值得尊敬，但很少带来超额的股东复利。`,
  }),
  futures: (name) => ({
    buffettStance: 'skeptical',
    mungerStance: 'skeptical',
    buffett: `${name}是合约，不是可以永续经营的企业。我买的是生意的一部分，不是对价格的短期赌注。`,
    munger: `把杠杆押在看对方向上，是把命运交给波动。这不叫投资，叫找刺激。`,
  }),
  unknown: (name, valuation, stock) => ({
    buffettStance: 'cautious',
    mungerStance: 'cautious',
    buffett: `对${name}，我只问三件事：生意是否简单、利润是否能变成现金、价格是否留了安全边际。${industryHint(stock)}${valuation}看不懂就路过，这是优势不是缺陷。`,
    munger: `倒过来想：什么会让这笔投资永久亏掉本金？答不上来，就说明还不够了解。能力圈之外的机会，放过即可。`,
  }),
}

function industryHint(stock: QuoteItem): string {
  return stock.industry ? `所属「${stock.industry}」需要先判断有没有定价权。` : ''
}

function describeValuation(stock: QuoteItem): string {
  const pe = getEffectivePe(stock)
  const pb = stock.pb
  if (pe === null && (pb === undefined || pb <= 0)) return ''
  if (pe !== null && pe < 0) return `目前盈利为负，谈市盈率没有意义，更要看现金会不会烧穿。`
  if (pe !== null && pe < 12) {
    const pbBit = pb && pb > 0 && pb < 1.2 ? `市净率 ${pb.toFixed(1)} 也偏低，` : ''
    return `动态估值大约 ${pe.toFixed(0)} 倍市盈率，${pbBit}若生意质量过关，安全边际相对更宽。`
  }
  if (pe !== null && pe < 25) {
    return `估值大约 ${pe.toFixed(0)} 倍市盈率，属于「好公司也要看价格」的区间。`
  }
  if (pe !== null) {
    return `约 ${pe.toFixed(0)} 倍市盈率已经把不少乐观贴现进去了，质量再好也要克制。`
  }
  if (pb && pb > 0 && pb < 1) return `市净率低于 1，要区分是真便宜还是价值陷阱。`
  if (pb && pb > 4) return `市净率偏高，说明市场已在为品质或故事付溢价。`
  return ''
}

function valuationClause(stock: QuoteItem): { buffett: string; munger: string; duan: string } | null {
  const pe = getEffectivePe(stock)
  if (pe === null || pe <= 0) return null
  if (pe < 12) {
    return {
      buffett: `以约 ${pe.toFixed(0)} 倍市盈率衡量，价格端比情绪热闹时更有容错。`,
      munger: `便宜不是充分条件，但确实减少了「做蠢事」的空间。`,
      duan: `便宜了才开始谈仓位；但便宜仍要先问是不是对的生意。`,
    }
  }
  if (pe > 40) {
    return {
      buffett: `大约 ${pe.toFixed(0)} 倍市盈率意味着几乎没有安全边际，再好的生意也不能无视价格。`,
      munger: `高估值把未来的完美执行变成了义务——义务越多，越该谨慎。`,
      duan: `这个价格不是对的价格。再好也不追，仓位就该是 0。`,
    }
  }
  return null
}

export function getEffectivePe(stock: QuoteItem): number | null {
  const pe = stock.pe ?? stock.peTtm
  if (pe === undefined || !Number.isFinite(pe) || pe === 0) return null
  return pe
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/^0+(\d+)$/, '$1')
}
