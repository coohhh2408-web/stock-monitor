# 数据合同

价值清单和财报页只消费当前打开的股票。没有的字段就停，不准补。

GitHub 上的取数 skill（例如 `simonlin1212/a-stock-data`）只当**端点地图**：哪些 URL 还活着、要不要签名、有没有 CORS。不要拿来「微调巴菲特模型」，也不要跟登录态、cookie、token 去爬雪球深度数据。

## 盘口（QuoteItem）

| 字段 | 用途 | 没有时 |
|---|---|---|
| `name` `code` `market` | 展示、匹配内置说明 | 不分析 |
| `price` | 习惯买点公式的现价 | 不报价 |
| `industry` | 辅助 `inferBusinessKind` | 只靠名称 |
| `pe` 或 `peTtm` | 当前市盈率 | 结论改为「先不报价」 |

市盈率必须与个股页盘口同一路。

## 最新财报（FinancialPeriod）

打开个股详情时按瀑布拉最新报告期（年报 / 半年报 / 季报）。浏览器直连优先，开发代理只作最后一档。

1. **东方财富 datacenter**（`Access-Control-Allow-Origin: *`，静态部署也能拉）
   - A 股：`RPT_F10_FINANCE_MAINFINADATA`，`SECUCODE=600519.SH`
   - 港股：`RPT_HKF10_FN_MAININDICATOR`，`SECUCODE=00700.HK`
   - 美股：`RPT_USF10_FN_GMAININDICATOR`，`SECUCODE=AAPL.O` / `KO.N`
2. **同花顺三表**（A 股备源，同样带 CORS）：`basic.10jqka.com.cn/api/stock/finance/{code}_benefit.json`（`_cash` / `_debt`）
3. **东方财富 emweb F10**（无 CORS，仅 Vite 开发代理 `/em-f10`）

| 字段 | 用途 |
|---|---|
| `reportName` `reportDate` `noticeDate` | 展示哪一期、何时披露 |
| `revenue` `netProfit` 及同比 | 财报页数字 |
| `operatingCashFlow` 或 `eps`+`ocfPerShare` 或 `ocfToRevenue`+`netMargin` | 赚钱质量 = 经营现金流÷净利 |
| `debtRatio` `currentRatio` `interestCoverage` | 负债安全；美股 datacenter 往往没有经营现金流和利息覆盖 |
| `grossMargin` `roe` `arDays` `inventoryDays` | 三人框架红旗，不单独编造护城河 |

这是第三方汇总，信息级最高 **B**。瀑布备源不是双源核对。没有巨潮/SEC 原文，禁止标 A。

## 快讯

| 源 | 浏览器 | 用法 |
|---|---|---|
| 东方财富快讯 | 无 CORS | 开发代理 `/em-kuaixun` |
| 财联社电报 `v1/roll/get_roll_list` | 无 CORS；`sign=md5(sha1(按 key 排序并用 & 拼接的 query))`，零 key | 开发代理 `/cls` |
| 华尔街见闻 lives | CORS `*` | 隧道和静态部署兜底 |
| 新浪直播 | 无 CORS | 开发代理 `/sina-zhibo` |
| 雪球 | 匿名会被 WAF/400，深度数据要 token | **不接** |

## 仍然没有（一律未知）

- 年报原文、10-K、股东信、电话会
- 自由现金流（维护性 capex 拆分）
- 管理层诚信记录
- 与年报原文对照的第二独立数据源
