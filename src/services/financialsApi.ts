import { usesDevProxy } from '@/lib/devProxy'
import { formatListedCode } from '@/lib/utils'
import { toEastMoneySecid } from '@/services/symbolMap'
import type { FinancialPeriod, FinancialsPack, QuoteItem } from '@/types/market'

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === '-' || value === '--' || value === false) {
    return null
  }
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

async function readJson<T>(url: string, timeoutMs = 10000): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
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

function emptyPeriod(reportDate: string, reportName: string, noticeDate?: string): FinancialPeriod {
  return {
    reportDate,
    reportName,
    noticeDate,
    revenue: null,
    netProfit: null,
    revenueYoy: null,
    profitYoy: null,
    eps: null,
    ocfPerShare: null,
    operatingCashFlow: null,
    ocfToRevenue: null,
    salesCashToRevenue: null,
    grossMargin: null,
    netMargin: null,
    roe: null,
    debtRatio: null,
    currentRatio: null,
    interestCoverage: null,
    quickRatio: null,
    cashRatio: null,
    arDays: null,
    inventoryDays: null,
  }
}

export function cashConversion(period: FinancialPeriod): number | null {
  if (period.operatingCashFlow !== null && period.netProfit !== null && period.netProfit !== 0) {
    return period.operatingCashFlow / period.netProfit
  }
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

  const fromCenter = await fetchDatacenter(stock)
  if (fromCenter) return fromCenter

  if (stock.market === 'a-share') {
    const ths = await fetchTonghuashun(stock)
    if (ths) return ths
  }

  if (stock.market === 'hk-stock') return fetchHkF10(stock)
  if (stock.market === 'us-stock') return null
  return fetchAShareF10(stock)
}

function toDatacenterSecucodes(stock: QuoteItem): string[] {
  const code = stock.code.trim().toUpperCase()
  if (stock.market === 'hk-stock') return [`${code.padStart(5, '0')}.HK`]
  if (stock.market === 'us-stock') {
    const secid = toEastMoneySecid(code, 'us-stock', stock.secid)
    const mkt = secid.split('.')[0]
    const preferred = mkt === '106' ? 'N' : mkt === '107' ? 'A' : 'O'
    const rest = ['O', 'N', 'A'].filter((s) => s !== preferred)
    return [`${code}.${preferred}`, ...rest.map((s) => `${code}.${s}`)]
  }
  if (/^(43|83|87|92)/.test(code)) return [`${code}.BJ`]
  if (/^[69]/.test(code) || code.startsWith('688')) return [`${code}.SH`]
  return [`${code}.SZ`]
}

function datacenterType(stock: QuoteItem): string {
  if (stock.market === 'hk-stock') return 'RPT_HKF10_FN_MAININDICATOR'
  if (stock.market === 'us-stock') return 'RPT_USF10_FN_GMAININDICATOR'
  return 'RPT_F10_FINANCE_MAINFINADATA'
}

function datacenterUrl(type: string, secucode: string): string {
  const filter = encodeURIComponent(`(SECUCODE="${secucode}")`)
  return (
    `https://datacenter.eastmoney.com/securities/api/data/get` +
    `?type=${encodeURIComponent(type)}&sty=ALL&p=1&ps=8&sr=-1&st=REPORT_DATE` +
    `&filter=${filter}&source=HSF10&client=APP`
  )
}

function preferYtd(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const ytd = rows.filter((row) => {
    const label = `${row.DATE_TYPE ?? ''} ${row.REPORT_TYPE ?? ''} ${row.REPORT_DATE_NAME ?? ''}`
    return !/单季/.test(label)
  })
  return ytd.length > 0 ? ytd : rows
}

async function fetchDatacenter(stock: QuoteItem): Promise<FinancialsPack | null> {
  const type = datacenterType(stock)
  for (const secucode of toDatacenterSecucodes(stock)) {
    try {
      const payload = await readJson<{ result?: { data?: Array<Record<string, unknown>> } }>(
        datacenterUrl(type, secucode),
      )
      const rows = preferYtd(payload.result?.data ?? [])
      const mapper =
        stock.market === 'hk-stock' ? mapHkDatacenter : stock.market === 'us-stock' ? mapUsDatacenter : mapAShare
      const periods = rows.map(mapper).filter((row): row is FinancialPeriod => row !== null)
      if (periods.length === 0) continue
      const marketLabel =
        stock.market === 'hk-stock' ? '港股' : stock.market === 'us-stock' ? '美股' : ''
      return {
        latest: periods[0],
        previous: periods[1] ?? null,
        sourceLabel: `东方财富${marketLabel} datacenter 主要指标`,
      }
    } catch {
      /* try next suffix / source */
    }
  }
  return null
}

function mapAShare(row: Record<string, unknown>): FinancialPeriod | null {
  const reportDate = isoDate(String(row.REPORT_DATE ?? ''))
  if (!reportDate) return null
  return {
    ...emptyPeriod(
      reportDate,
      String(row.REPORT_DATE_NAME ?? row.REPORT_TYPE ?? reportNameFromDate(reportDate)),
      isoDate(String(row.NOTICE_DATE ?? '')) || undefined,
    ),
    revenue: num(row.TOTALOPERATEREVE) ?? num(row.OPERATE_INCOME_PK),
    netProfit: num(row.PARENTNETPROFIT),
    revenueYoy: pct(row.TOTALOPERATEREVETZ),
    profitYoy: pct(row.PARENTNETPROFITTZ),
    eps: num(row.EPSJB),
    ocfPerShare: num(row.MGJYXJJE),
    operatingCashFlow: num(row.NETCASH_OPERATE_PK),
    ocfToRevenue: ratio(row.JYXJLYYSR),
    salesCashToRevenue: ratio(row.XSJXLYYSR),
    grossMargin: pct(row.XSMLL),
    netMargin: pct(row.XSJLL),
    roe: pct(row.ROEJQ),
    debtRatio: pct(row.ZCFZL),
    currentRatio: num(row.LD),
    interestCoverage: num(row.INTSTCOVRATE) ?? num(row.INTEREST_COVERAGE_RATIO),
    quickRatio: num(row.SD),
    cashRatio: num(row.XJLLB),
    arDays: num(row.YSZKZZTS),
    inventoryDays: num(row.CHZZTS),
  }
}

function mapHkDatacenter(row: Record<string, unknown>): FinancialPeriod | null {
  const reportDate = isoDate(String(row.REPORT_DATE ?? row.STD_REPORT_DATE ?? ''))
  if (!reportDate) return null
  return {
    ...emptyPeriod(reportDate, String(row.REPORT_TYPE ?? reportNameFromDate(reportDate))),
    revenue: num(row.OPERATE_INCOME),
    netProfit: num(row.HOLDER_PROFIT),
    revenueYoy: pct(row.OPERATE_INCOME_YOY),
    profitYoy: pct(row.HOLDER_PROFIT_YOY),
    eps: num(row.BASIC_EPS),
    ocfPerShare: num(row.PER_NETCASH_OPERATE),
    operatingCashFlow: num(row.NETCASH_OPERATE),
    ocfToRevenue: ratio(row.OCF_SALES),
    salesCashToRevenue: null,
    grossMargin: pct(row.GROSS_PROFIT_RATIO),
    netMargin: pct(row.NET_PROFIT_RATIO),
    roe: pct(row.ROE_YEARLY) ?? pct(row.ROE_AVG),
    debtRatio: pct(row.DEBT_ASSET_RATIO),
    currentRatio: num(row.CURRENT_RATIO),
  }
}

function mapUsDatacenter(row: Record<string, unknown>): FinancialPeriod | null {
  const reportDate = isoDate(String(row.REPORT_DATE ?? ''))
  if (!reportDate) return null
  return {
    ...emptyPeriod(
      reportDate,
      String(row.REPORT_DATA_TYPE ?? row.REPORT_TYPE ?? reportNameFromDate(reportDate)),
      isoDate(String(row.NOTICE_DATE ?? '')) || undefined,
    ),
    revenue: num(row.OPERATE_INCOME),
    netProfit: num(row.PARENT_HOLDER_NETPROFIT),
    revenueYoy: pct(row.OPERATE_INCOME_YOY),
    profitYoy: pct(row.PARENT_HOLDER_NETPROFIT_YOY),
    eps: num(row.BASIC_EPS),
    ocfToRevenue: null,
    grossMargin: pct(row.GROSS_PROFIT_RATIO),
    netMargin: pct(row.NET_PROFIT_RATIO),
    roe: pct(row.ROE_AVG),
    debtRatio: pct(row.DEBT_ASSET_RATIO),
    currentRatio: num(row.CURRENT_RATIO),
    quickRatio: num(row.SPEED_RATIO),
    arDays: num(row.ACCOUNTS_RECE_TDAYS),
    inventoryDays: num(row.INVENTORY_TDAYS),
  }
}

interface ThsTable {
  title: Array<string | unknown[]>
  simple: unknown[][]
  simple_yoy?: unknown[][]
}

function parseThsFlash(raw: unknown): ThsTable | null {
  const envelope = raw as { flashData?: unknown }
  const inner = typeof envelope.flashData === 'string' ? JSON.parse(envelope.flashData) : envelope.flashData
  if (!inner || !Array.isArray(inner.title) || !Array.isArray(inner.simple)) return null
  return inner as ThsTable
}

function thsRowName(title: string | unknown[]): string {
  return Array.isArray(title) ? String(title[0] ?? '') : String(title)
}

function thsPick(table: ThsTable, names: string[], index: number): number | null {
  for (const name of names) {
    const i = table.title.findIndex((row) => thsRowName(row) === name)
    if (i < 0) continue
    const n = num(table.simple[i]?.[index])
    if (n !== null) return n
  }
  return null
}

function thsYoy(table: ThsTable, names: string[], index: number): number | null {
  if (!table.simple_yoy) return null
  for (const name of names) {
    const i = table.title.findIndex((row) => thsRowName(row) === name)
    if (i < 0) continue
    const n = num(table.simple_yoy[i]?.[index])
    if (n !== null) return n
  }
  return null
}

async function fetchTonghuashun(stock: QuoteItem): Promise<FinancialsPack | null> {
  const code = stock.code.trim()
  if (!/^\d{6}$/.test(code)) return null
  try {
    const [benefitRaw, cashRaw, debtRaw] = await Promise.all([
      readJson(`https://basic.10jqka.com.cn/api/stock/finance/${code}_benefit.json`, 12000),
      readJson(`https://basic.10jqka.com.cn/api/stock/finance/${code}_cash.json`, 12000),
      readJson(`https://basic.10jqka.com.cn/api/stock/finance/${code}_debt.json`, 12000),
    ])
    const benefit = parseThsFlash(benefitRaw)
    const cash = parseThsFlash(cashRaw)
    const debt = parseThsFlash(debtRaw)
    if (!benefit) return null
    const dates = (benefit.simple[0] ?? []).map((d) => isoDate(String(d))).filter(Boolean)
    if (dates.length === 0) return null

    const periods = dates.slice(0, 2).map((reportDate, index) => {
      const revenue = thsPick(benefit, ['*营业总收入', '一、营业总收入'], index)
      const netProfit = thsPick(benefit, ['*归属于母公司所有者的净利润', '*净利润'], index)
      const ocf = cash ? thsPick(cash, ['*经营活动产生的现金流量净额', '经营活动产生的现金流量净额'], index) : null
      const assets = debt ? thsPick(debt, ['*资产合计'], index) : null
      const liab = debt ? thsPick(debt, ['*负债合计'], index) : null
      const currentAssets = debt ? thsPick(debt, ['流动资产合计'], index) : null
      const currentLiab = debt ? thsPick(debt, ['流动负债合计'], index) : null
      return {
        ...emptyPeriod(reportDate, reportNameFromDate(reportDate)),
        revenue,
        netProfit,
        revenueYoy: thsYoy(benefit, ['*营业总收入'], index),
        profitYoy: thsYoy(benefit, ['*归属于母公司所有者的净利润', '*净利润'], index),
        operatingCashFlow: ocf,
        ocfToRevenue: revenue && revenue !== 0 && ocf !== null ? ocf / revenue : null,
        debtRatio: assets && assets !== 0 && liab !== null ? (liab / assets) * 100 : null,
        currentRatio:
          currentAssets !== null && currentLiab !== null && currentLiab !== 0
            ? currentAssets / currentLiab
            : null,
      }
    })
    if (!periods[0]?.revenue && !periods[0]?.netProfit) return null
    return {
      latest: periods[0],
      previous: periods[1] ?? null,
      sourceLabel: '同花顺 F10 财务报表',
    }
  } catch {
    return null
  }
}

async function fetchAShareF10(stock: QuoteItem): Promise<FinancialsPack | null> {
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

interface HkZyzb {
  status?: number
  data?: { zyzb_abgq?: string[][] }
}

async function fetchHkF10(stock: QuoteItem): Promise<FinancialsPack | null> {
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
    ...emptyPeriod(reportDate, reportNameFromDate(reportDate)),
    revenue: num(dict['营业总收入(元)']),
    netProfit: num(dict['归母净利润']),
    revenueYoy: pct(dict['营业总收入同比增长(%)']),
    profitYoy: pct(dict['归母净利润同比增长(%)']),
    eps: num(dict['基本每股收益(元)']),
    ocfPerShare: num(dict['每股经营现金流(元)']),
    ocfToRevenue: ratio(dict['经营现金流/营业收入(%)']),
    grossMargin: pct(dict['毛利率(%)']),
    netMargin: pct(dict['净利率(%)']),
    roe: pct(dict['平均净资产收益率(%)']) ?? pct(dict['年化净资产收益率(%)']),
    debtRatio: pct(dict['资产负债率(%)']),
    currentRatio: num(dict['流动比率']),
  }
}
