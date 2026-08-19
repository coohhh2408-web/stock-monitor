# 数据合同

价值清单和财报页只消费当前打开的股票。没有的字段就停，不准补。

## 盘口（QuoteItem）

| 字段 | 用途 | 没有时 |
|---|---|---|
| `name` `code` `market` | 展示、匹配内置说明 | 不分析 |
| `price` | 习惯买点公式的现价 | 不报价 |
| `industry` | 辅助 `inferBusinessKind` | 只靠名称 |
| `pe` 或 `peTtm` | 当前市盈率 | 结论改为「先不报价」 |

市盈率必须与个股页盘口同一路。

## 最新财报（FinancialPeriod）

打开个股详情时，从东方财富 F10 拉最新报告期（年报 / 半年报 / 季报，按报告期排序取第一条）。

| 字段 | 用途 |
|---|---|
| `reportName` `reportDate` `noticeDate` | 展示哪一期、何时披露 |
| `revenue` `netProfit` 及同比 | 财报页数字 |
| `eps` `ocfPerShare` 或 `ocfToRevenue` + `netMargin` | 赚钱质量 = 经营现金流÷净利 |
| `debtRatio` `currentRatio` | 负债安全 |
| `grossMargin` `roe` `arDays` `inventoryDays` | 三人框架红旗，不单独编造护城河 |

A 股：`/PC_HSF10/NewFinanceAnalysis/ZYZBAjaxNew?type=0`
港股：`/PC_HKF10/NewFinancialAnalysis/GetZYZB`
美股：尚未接通同一路，Q5/Q6 保持未知。

这是第三方汇总，信息级最高 **B**。没有巨潮/SEC 原文，禁止标 A。

## 仍然没有（一律未知）

- 年报原文、10-K、股东信、电话会
- 利息覆盖、自由现金流（维护性 capex 拆分）
- 管理层诚信记录
- 第二独立数据源
