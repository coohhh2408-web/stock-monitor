---
name: stock-screener
description: |
  选股、筛选、习惯带、哪只股票便宜、价值选股。改 StockScreener、screenerApi、stockScreener 时用本 skill。禁止把筛出来的名单写成巴菲特持仓或荐股。
---

# 价值选股

收费卖的是**同一套习惯市盈率带的筛法**，不是荐股池。

## 用户怎么用

底部「选股」：选市场 → 选预设 → 看名单 → 加入看板。三步内完成。

默认预设是 **进入习惯带**：已归类，且当前市盈率 ≤ 该生意 `PE_BAND.buy`。

## 样本

- 东方财富 `clist`（`push2delay`，CORS `*`），按市值从大到小，每个市场大约 200 只。
- 必须有 0–80 倍市盈率。ST、权证、基金、-R、优先股不进。
- **不是全市场穷举。** 界面要写样本边界。

## 打分

和个股价值清单同一套：

1. `inferBusinessKind`（名称 + 东财行业关键词；白名单代码优先）
2. `PE_BAND[kind].buy / stretch`
3. 未归类默认不进「进入习惯带」，避免把未知 15 倍当成买点

禁止：到价自动该买、仓位百分比、大师姓名当背书。

## 改代码

- `src/services/screenerApi.ts` — 取数
- `src/services/stockScreener.ts` — 预设与打分
- `src/components/StockScreener/StockScreener.tsx` — 界面
- 生意类型关键词在 `src/services/buffettMunger.ts`，改了会同时影响个股清单
