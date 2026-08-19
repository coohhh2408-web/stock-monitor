import { formatListedCode } from '@/lib/utils'
import type { FinancialPeriod, FinancialsPack, QuoteItem } from '@/types/market'

function usesDevProxy(): boolean {
  return typeof window !== 'undefined' && window.location.port === '5173'
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === '-' || value === '--') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const raw = String(value).trim().replace(/,/g, '')
  if (!raw || raw === '--') return null
  const yi = raw.match(/^(-?\d+(?:\.\d+)?)万亿$/)
  if (yi) return Number(yi[1]) * 1e12
  const y = raw.match(/^(-?\d+(?:\.\d+)?)亿$/)
  if (y) return Number(y[1]) * 1e8
  const w = raw.match(/^(-?\d+(?:\.\d+)?)万$/)
  if (w) return Number(w[1]) * 1e4
  const n = Number(raw.replace(/%/g, ''))
  return Number.isFinite(n) ? n : null
}

/** 东财有的字段是 0.78（比率），有的是 78（百分数）。大于 2 当百分数。 */
function ratio(value: unknown): number | null {
  const n = num(value)
  if (n === null) return null
  return n > 2 ? n / 100 : n
}

function pct(value: unknown): number | null {
  return num(value)
}

async function readJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

function f10Urls(path: string): string[] {
  const urls = [`https://emweb.securities.eastmoney.com${path}`]
  if (usesDevProxy()) urls.unshift(`/em-f10${path}`)
  return urls
}

function reportNameFromDate(iso: string): string {
  const date = iso.slice(0, 10)
  const year = date.slice(0, 4)
  const month = date.slice(5, 7)
  if (month === '12') return `${year}年报`
  if (month === '09') return `${year}三季报`
  if (month === '06') return `${year}中报`
  if (month === '03') return `${year}一季报`
  return date
}

function isoDate(raw: string | undefined): string {
  if (!raw) return ''
  const compact = raw.trim().replace(/\//g, '-')
  const ymd = compact.match(/^(\d{4}-\d{2}-\d{2})/)
  if (ymd) return ymd[1]
  const short = compact.match(/^(\d{2})-(\d{2})-(\d{2})$/)
  if (short) return `20${short[1]}-${short[2]}-${short[3]}`
  return compact.slice(0, 10)
}

export function cashConversion(period: FinancialPeriod): number | null {
  if (period.ocfPerShare !== null && period.eps !== null && period.eps > 0) {
    return period.ocfPerShare / period.eps
  }
  if (period.ocfToRevenue !== null && period.netMargin !== null && period.netMargin > 0) {
    return period.ocfToRevenue / (period.netMargin / 100)
  }
  return null
}

export async function fetchFinancials(stock: QuoteItem): Promise<FinancialsPack | null> {
  if (stock.market === 'futures') return null
  if (stock.market === 'hk-stock') return fetchHk(stock)
  if (stock.market === 'us-stock') return null
  return fetchAShare(stock)
}

async function fetchAShare(stock: QuoteItem): Promise<FinancialsPack | null> {
  const listed = formatListedCode(stock.code, stock.market)
  const path = `/PC_HSF10/NewFinanceAnalysis/ZYZBAjaxNew?type=0&code=${encodeURIComponent(listed)}`
  for (const url of f10Urls(path)) {
    try {
      const payload = await readJson<{ data?: Array<Record<string, unknown>>; status?: number }>(url)
      const rows = payload.data ?? []
      const periods = rows.map(mapAShare).filter((row): row is FinancialPeriod => row !== null)
      if (periods.length === 0) continue
      return {
        latest: periods[0],
        previous: periods[1] ?? null,
        sourceLabel: '东方财富 F10 主要指标',
      }
    } catch {
      /* try next */
    }
  }
  return null
}

function mapAShare(row: Record<string, unknown>): FinancialPeriod | null {
  const reportDate = isoDate(String(row.REPORT_DATE ?? ''))
  if (!reportDate) return null
  return {
    reportDate,
    reportName: String(row.REPORT_DATE_NAME ?? reportNameFromDate(reportDate)),
    noticeDate: isoDate(String(row.NOTICE_DATE ?? '')) || undefined,
    revenue: num(row.TOTALOPERATEREVE),
    netProfit: num(row.PARENTNETPROFIT),
    revenueYoy: pct(row.TOTALOPERATEREVETZ),
    profitYoy: pct(row.PARENTNETPROFITTZ),
    eps: num(row.EPSJB),
    ocfPerShare: num(row.MGJYXJJE),
    ocfToRevenue: ratio(row.JYXJLYYSR),
    salesCashToRevenue: ratio(row.XSJXLYYSR),
    grossMargin: pct(row.XSMLL),
    netMargin: pct(row.XSJLL),
    roe: pct(row.ROEJQ),
    debtRatio: pct(row.ZCFZL),
    currentRatio: num(row.LD),
    quickRatio: num(row.SD),
    cashRatio: num(row.XJLLB),
    arDays: num(row.YSZKZZTS),
    inventoryDays: num(row.CHZZTS),
  }
}

interface HkZyzb {
  status?: number
  data?: { zyzb_abgq?: string[][] }
}

async function fetchHk(stock: QuoteItem): Promise<FinancialsPack | null> {
  const code = stock.code.trim().padStart(5, '0')
  const path = `/PC_HKF10/NewFinancialAnalysis/GetZYZB?code=${encodeURIComponent(code)}`
  for (const url of f10Urls(path)) {
    try {
      const payload = await readJson<HkZyzb>(url)
      const table = payload.data?.zyzb_abgq
      if (!table || table.length < 2) continue
      const labels = table[0]
      const periods = table
        .slice(1)
        .map((vals) => mapHkRow(labels, vals))
        .filter((row): row is FinancialPeriod => row !== null)
      if (periods.length === 0) continue
      return {
        latest: periods[0],
        previous: periods[1] ?? null,
        sourceLabel: '东方财富港股 F10 主要指标',
      }
    } catch {
      /* try next */
    }
  }
  return null
}

function mapHkRow(labels: string[], vals: string[]): FinancialPeriod | null {
  const dict: Record<string, string> = {}
  for (let i = 0; i < Math.min(labels.length, vals.length); i++) {
    const label = labels[i]
    if (/指标$/.test(label)) continue
    dict[label] = vals[i]
  }
  const reportDate = isoDate(vals[0])
  if (!reportDate) return null
  return {
    reportDate,
    reportName: reportNameFromDate(reportDate),
    revenue: num(dict['营业总收入(元)']),
    netProfit: num(dict['归母净利润']),
    revenueYoy: pct(dict['营业总收入同比增长(%)']),
    profitYoy: pct(dict['归母净利润同比增长(%)']),
    eps: num(dict['基本每股收益(元)']),
    ocfPerShare: num(dict['每股经营现金流(元)']),
    ocfToRevenue: ratio(dict['经营现金流/营业收入(%)']),
    salesCashToRevenue: null,
    grossMargin: pct(dict['毛利率(%)']),
    netMargin: pct(dict['净利率(%)']),
    roe: pct(dict['平均净资产收益率(%)']) ?? pct(dict['年化净资产收益率(%)']),
    debtRatio: pct(dict['资产负债率(%)']),
    currentRatio: num(dict['流动比率']),
    quickRatio: null,
    cashRatio: null,
    arDays: null,
    inventoryDays: null,
  }
}
