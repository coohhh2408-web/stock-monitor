import { formatLargeNumber } from '@/lib/utils'
import { cashConversion } from '@/services/financialsApi'
import type { BusinessKind } from '@/services/buffettMunger'
import type { FinancialPeriod, FinancialsPack } from '@/types/market'

export interface EarningsLens {
  author: '巴菲特' | '芒格' | '段永平'
  lens: string
  take: string
}

export interface EarningsBrief {
  headline: string
  periodLabel: string
  sourceLabel: string
  metrics: { label: string; value: string }[]
  conversion: number | null
  lenses: EarningsLens[]
  limit: string
}

export function buildEarningsBrief(
  name: string,
  kind: BusinessKind,
  pack: FinancialsPack,
): EarningsBrief {
  const p = pack.latest
  const conversion = cashConversion(p)
  const convText = conversion === null ? '—' : `${(conversion * 100).toFixed(0)}%`
  const metrics = [
    { label: '营收', value: money(p.revenue) },
    { label: '归母净利', value: money(p.netProfit) },
    { label: '营收同比', value: yoy(p.revenueYoy) },
    { label: '净利同比', value: yoy(p.profitYoy) },
    { label: '经营现金流/净利', value: convText },
    { label: '毛利率', value: pct(p.grossMargin) },
    { label: '净利率', value: pct(p.netMargin) },
    { label: 'ROE', value: pct(p.roe) },
    { label: '资产负债率', value: pct(p.debtRatio) },
    { label: '流动比率', value: p.currentRatio === null ? '—' : p.currentRatio.toFixed(2) },
  ]

  const vsPrev = pack.previous ? `上一期是${pack.previous.reportName}。` : ''
  const headline = headlineFrom(p, conversion)

  return {
    headline,
    periodLabel: p.noticeDate ? `${p.reportName} · 披露 ${p.noticeDate}` : p.reportName,
    sourceLabel: pack.sourceLabel,
    metrics,
    conversion,
    lenses: [
      {
        author: '巴菲特',
        lens: '业主收益 · 现金比利润重要',
        take: buffettTake(name, p, conversion, kind),
      },
      {
        author: '芒格',
        lens: '倒过来想 · 数字哪里会骗人',
        take: mungerTake(p, conversion, vsPrev),
      },
      {
        author: '段永平',
        lens: '对的生意 · 先看质量再看增速',
        take: duanTake(p, conversion, kind),
      },
    ],
    limit:
      '数字来自东方财富 F10 主要指标，是第三方汇总，不是年报原文、附注或电话会。没有 MD&A 就不判断管理层是否坦诚。这不是投顾建议。',
  }
}

function headlineFrom(p: FinancialPeriod, conversion: number | null): string {
  const profit = p.profitYoy
  const cashOk = conversion !== null && conversion >= 0.8
  const cashWeak = conversion !== null && conversion < 0.5
  if (profit !== null && profit < -10 && cashWeak) return '利润和现金一起变差'
  if (profit !== null && profit > 15 && cashOk) return '利润增长，现金也跟上了'
  if (profit !== null && profit > 15 && cashWeak) return '利润很好看，现金没跟上'
  if (cashOk && (profit === null || Math.abs(profit) <= 15)) return '现金对得上利润'
  if (cashWeak) return '利润变现偏弱'
  return '先看本期数字，不急着下结论'
}

function buffettTake(name: string, p: FinancialPeriod, conversion: number | null, kind: BusinessKind): string {
  const cash =
    conversion === null
      ? '经营现金流还对不上净利，业主收益这一步先空着。'
      : conversion >= 1
        ? `经营现金流约为净利的 ${(conversion * 100).toFixed(0)}%，利润大体能变成现金。`
        : conversion >= 0.8
          ? `经营现金流约为净利的 ${(conversion * 100).toFixed(0)}%，勉强覆盖，还要看是不是季节性。`
          : `经营现金流只有净利的 ${(conversion * 100).toFixed(0)}%，账面利润不能直接当业主收益。`
  const debt =
    kind === 'bank' || kind === 'insurance'
      ? '金融股的资产负债率不能按普通企业读，这一项不作硬结论。'
      : p.debtRatio === null
        ? '负债数据缺，不谈安全边际。'
        : `资产负债率 ${p.debtRatio.toFixed(0)}%${p.currentRatio !== null ? `，流动比率 ${p.currentRatio.toFixed(2)}` : ''}。`
  const yoyBit =
    p.revenueYoy !== null && p.profitYoy !== null
      ? `${name}本期营收同比 ${fmtYoy(p.revenueYoy)}，净利同比 ${fmtYoy(p.profitYoy)}。`
      : ''
  return `${yoyBit}${cash}${debt}这只说明这一期报表的现金和杠杆，不是内在价值。`
}

function mungerTake(p: FinancialPeriod, conversion: number | null, vsPrev: string): string {
  const flags: string[] = []
  if (conversion !== null && conversion < 0.8) flags.push('利润比现金跑得快，常见于应收、存货或一次性收益')
  if (p.arDays !== null && p.arDays > 90) flags.push(`应收周转 ${p.arDays.toFixed(0)} 天，要防渠道压货`)
  if (p.inventoryDays !== null && p.inventoryDays > 180) flags.push(`存货周转 ${p.inventoryDays.toFixed(0)} 天，周期股尤其危险`)
  if (p.grossMargin !== null && p.grossMargin < 15) flags.push(`毛利率 ${p.grossMargin.toFixed(0)}%，定价权很弱`)
  if (p.profitYoy !== null && p.revenueYoy !== null && p.profitYoy - p.revenueYoy > 40) {
    flags.push('净利增速远高于营收，先问是不是费用或非经常项目')
  }
  if (flags.length === 0) {
    return `${vsPrev}这一期没有明显的「利润骗人」信号，但不等于没有风险。聪明人会问：周期反转时这些倍数还在吗？`
  }
  return `${vsPrev}先记这些红旗：${flags.join('；')}。倒过来想，比把增速当成护城河更有用。`
}

function duanTake(p: FinancialPeriod, conversion: number | null, kind: BusinessKind): string {
  const margin = p.grossMargin
  const business =
    margin !== null && margin >= 40
      ? `毛利率 ${margin.toFixed(0)}%，更像能讲清的生意。`
      : margin !== null && margin < 20
        ? `毛利率 ${margin.toFixed(0)}%，要先问是不是对的生意，而不是追增速。`
        : p.netMargin !== null
          ? `净利率 ${p.netMargin.toFixed(1)}%。生意好不好，看是不是经常能变成现金。`
          : '毛利率还没对上，生意质量这一步先空着。'
  const cash =
    conversion !== null && conversion < 0.8
      ? '现金跟不上利润，先别谈对的价格。'
      : '对的价格是下一问，这一页只看报表质量。'
  const kindBit =
    kind === 'commodity' || kind === 'solar' || kind === 'auto'
      ? '周期和制造股，景气数字很好看的时候，往往不是对的价格。'
      : ''
  return `${business}${cash}${kindBit}`
}

function money(n: number | null): string {
  if (n === null) return '—'
  return formatLargeNumber(n)
}

function yoy(n: number | null): string {
  if (n === null) return '—'
  return fmtYoy(n)
}

function fmtYoy(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function pct(n: number | null): string {
  if (n === null) return '—'
  return `${n.toFixed(1)}%`
}
