# Cloud 开会手递（Cursor Cloud 专用）

本机 Mac Claude Code / ark Terminal **不是**这条通道。不要 ping-claude.sh，不要选 This Mac。

## 规矩

1. SS 说「让 Claude 再看看 / 能和 Claude 开会吗」→ 回答「能」，然后 **Task 开子代理**。
2. 子代理 = 独立复核者（参谋长）：只读审计，带文件路径证据，给 SS 的 A/B 拍板清单。禁止假装已和本机 Claude 开过会。
3. 子代理 prompt 必含：
   - 议题：（SS 指定的；没指定就问一句）
   - 仓库：stock-monitor
   - 禁止抢改 `peerCompare` / `companyIntel` / `roundtableService` 核心（P1 本机参谋长接）
   - 输出：共识 / 分歧 / 风险 + A/B 选项
   - 「Waiting for subagent」= 正常，等子代理跑完再汇总，**5 条以内**给 SS
4. 分工：
   - Cloud 子代理 Claude → 快审拍板
   - Cloud Cursor → SS 拍板后改代码，push origin
   - 本机 Mac 才做：supabase deploy、Pages push、`npm run ios:local`
5. 当前阻塞（审计可引用）：
   - Supabase edge 仍 404
   - 手机用产品 → Safari `https://coohhh2408-web.github.io/stock-monitor/`
   - 若 `origin/main` 已含圆桌 why-buy + peer-alternatives，以 main 为准；本云 clone 读不到则以 fetch 结果为准，不编造文件

## 没指定议题时问

这轮审 ① 手机端入口 ② edge deploy ③ PE/peer 口径？
