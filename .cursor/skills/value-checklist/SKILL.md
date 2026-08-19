---
name: value-checklist
description: |
  个股价值清单、习惯买点、市盈率对照、八道关、能力圈、安全边际、要不要买这只股票。即使没提巴菲特，只要在改价值清单、BuffettMungerBrief、sagePlan、valueSkill，就用本 skill。禁止扮演大师、禁止编造市盈率、禁止把仓位百分比写成投顾建议。
---

# 价值清单（Cursor）

改这个功能时，完整规则在仓库 `skills/value-checklist/SKILL.md`。先读它和 `references/`，再改代码。

可执行实现：

- `src/services/valueSkill.ts` — 八道关、信息级
- `src/services/valueChecklist.ts` — 习惯买点与默认 ToC 结论
- `src/components/MarketDashboard/BuffettMungerBrief.tsx` — 界面

硬禁令与数据合同以 `skills/value-checklist/` 为准，不要用研究对照里的大师口吻覆盖默认清单。
