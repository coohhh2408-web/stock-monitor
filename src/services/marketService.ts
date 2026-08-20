import { buildBuffettMungerBrief } from '@/services/buffettMunger'
import { newId } from '@/lib/id'
import type { QuoteItem, SparklineDataPoint, AIDiagnosisStub } from '@/types/market'

export function generateSparkline(basePrice: number, seed = 0, points = 48): SparklineDataPoint[] {
  let price = basePrice * (1 - 0.008)
  return Array.from({ length: points }, (_, i) => {
    const pseudo = Math.sin(i * 0.35 + seed * 1.7) * 0.5 + Math.cos(i * 0.18 + seed) * 0.3
    const drift = (basePrice - price) * 0.02
    price += drift + pseudo * basePrice * 0.002
    const hour = 9 + Math.floor(i / 8)
    const minute = (i % 8) * 7 + 30
    return {
      time: `${hour}:${String(minute % 60).padStart(2, '0')}`,
      price: Math.round(price * 100) / 100,
    }
  })
}

export function tickQuote(quote: QuoteItem): QuoteItem {
  const volatility = quote.market === 'futures' ? 0.0008 : 0.0012
  const delta = (Math.random() - 0.48) * quote.price * volatility
  const newPrice = Math.round((quote.price + delta) * 100) / 100
  const change = Math.round((newPrice - quote.open) * 100) / 100
  const changePercent = Math.round((change / quote.open) * 10000) / 100

  return {
    ...quote,
    price: newPrice,
    change,
    changePercent,
    high: Math.max(quote.high, newPrice),
    low: Math.min(quote.low, newPrice),
  }
}

export function buildPosition(input: {
  id?: string
  name: string
  code: string
  shares: number
  originalCost: number
  actualCost?: number
  currentPrice: number
  prevClose?: number
}): import('@/types/position').PositionItem {
  const shares = Math.max(0, input.shares)
  const originalCost = input.originalCost
  const actualCost = input.actualCost ?? originalCost
  const price = input.currentPrice
  const prevClose = input.prevClose ?? price
  const tTradeSaved = Math.max(0, Math.round((originalCost - actualCost) * 100) / 100)

  return {
    id: input.id ?? newId(),
    name: input.name,
    code: input.code,
    currentPrice: price,
    originalCost,
    actualCost,
    tTradeSaved,
    shares,
    marketValue: Math.round(price * shares),
    dailyPnL: Math.round((price - prevClose) * shares * 100) / 100,
    totalPnL: Math.round((price - actualCost) * shares * 100) / 100,
    strategyStatus: inferStrategyStatus(price, actualCost, originalCost),
  }
}

export function syncPositionPrice(
  positions: import('@/types/position').PositionItem[],
  quotes: QuoteItem[],
): import('@/types/position').PositionItem[] {
  return positions.map((pos) => {
    const quote = quotes.find((q) => q.code === pos.code)
    if (!quote) return pos

    const marketValue = Math.round(quote.price * pos.shares)
    const totalPnL = Math.round((quote.price - pos.actualCost) * pos.shares * 100) / 100
    const prevClose = quote.price - quote.change
    const dailyPnL = Math.round((quote.price - prevClose) * pos.shares * 100) / 100

    return {
      ...pos,
      currentPrice: quote.price,
      marketValue,
      totalPnL,
      dailyPnL,
      strategyStatus: inferStrategyStatus(quote.price, pos.actualCost, pos.originalCost),
    }
  })
}

function inferStrategyStatus(
  price: number,
  actualCost: number,
  originalCost: number,
): import('@/types/position').TTradeStrategyStatus {
  const margin = (price - actualCost) / actualCost
  const room = (price - originalCost) / originalCost
  if (margin >= 0.015 && room >= 0.02) return 'trigger-zone'
  if (margin < 0.005) return 'insufficient-space'
  return 'watching'
}

const DIAGNOSIS_TEMPLATES: Record<string, Partial<AIDiagnosisStub>> = {
  '600519': {
    moatAnalysis: '贵州茅台具备极强的品牌护城河与定价权，直销渠道占比持续提升，毛利率长期维持 90%+。产能稀缺性与社交属性构成双重壁垒，符合巴菲特「永续竞争优势」标准。',
    roeDuPont: 'ROE 约 32%，杜邦拆解：净利率 52% × 资产周转率 0.45 × 权益乘数 1.35。高净利率是 ROE 核心驱动，杠杆温和，经营效率稳定。',
    anomalySummary: '今日放量上涨 1.4%，北向资金连续 3 日净买入。半年报预告超预期，批价企稳回升，渠道库存处于健康水位。',
  },
  '300750': {
    moatAnalysis: '宁德时代在全球动力电池市占率领先，规模效应与研发投入构成成本护城河。绑定主流车企的长协订单提供需求确定性，但行业竞争加剧需持续关注。',
    roeDuPont: 'ROE 约 22%，杜邦拆解：净利率 11% × 资产周转率 0.65 × 权益乘数 3.1。权益乘数偏高反映杠杆运用，需关注负债结构变化。',
    anomalySummary: '今日小幅回调 1.6%，板块整体承压。装机量数据符合预期，关注后续固态电池量产进度与海外扩张节奏。',
  },
  default: {
    moatAnalysis: '该标的具备一定的行业地位与竞争壁垒，建议结合最新财报中的毛利率趋势、市场份额变化及管理层资本配置能力进行综合评估。',
    roeDuPont: '基于最新财务数据，ROE 杜邦拆解显示盈利质量整体稳健。建议重点关注净利率变动方向与资产周转效率的协同效应。',
    anomalySummary: '近期价格波动处于正常区间，暂无明显异常信号。建议关注成交量变化与板块联动效应，等待更清晰的方向确认。',
  },
}

export async function generateAIDiagnosis(stock: QuoteItem): Promise<AIDiagnosisStub> {
  await new Promise((r) => setTimeout(r, 1800 + Math.random() * 800))
  const template = DIAGNOSIS_TEMPLATES[stock.code] ?? DIAGNOSIS_TEMPLATES.default
  const sage = buildBuffettMungerBrief(stock)
  const direction = stock.change >= 0 ? '上涨' : '下跌'
  const defaultAnomaly =
    template === DIAGNOSIS_TEMPLATES.default
      ? `今日${direction} ${Math.abs(stock.changePercent).toFixed(2)}%。近期波动处于正常观察区间，建议结合成交量与板块联动，等待更清晰的方向确认。`
      : template.anomalySummary
  return {
    status: 'ready',
    moatAnalysis: template.moatAnalysis,
    roeDuPont: template.roeDuPont,
    anomalySummary: defaultAnomaly,
    buffettSummary: sage.buffett.summary,
    mungerSummary: sage.munger.summary,
    duanSummary: sage.duan.summary,
  }
}

export function computePortfolioSummary(
  positions: import('@/types/position').PositionItem[],
): import('@/types/position').PortfolioSummary {
  return {
    totalMarketValue: Math.round(positions.reduce((s, p) => s + p.marketValue, 0) * 100) / 100,
    totalCost: Math.round(positions.reduce((s, p) => s + p.actualCost * p.shares, 0) * 100) / 100,
    totalPnL: Math.round(positions.reduce((s, p) => s + p.totalPnL, 0) * 100) / 100,
    dailyPnL: Math.round(positions.reduce((s, p) => s + p.dailyPnL, 0) * 100) / 100,
    tTradeSavedTotal: Math.round(positions.reduce((s, p) => s + p.tTradeSaved * p.shares, 0) * 100) / 100,
  }
}
