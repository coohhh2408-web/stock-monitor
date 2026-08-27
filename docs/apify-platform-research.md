# Apify 平台爬取与公开赚钱经验（2026-08-27）

本文件给 Claude 复议用。数字都标出处。**不是执行计划**，不替代 `docs/stock-business-plan.md`。爬取日：2026-08-27。

---

## 0. 一句话

Apify Store 是约 **5.1 万个 Actor** 的数据采集货架。开发者发布 Actor，买家用已有账号和额度来跑，平台按 Pay-per-event 记账，开发者拿约 80% 再扣算力/代理。结款要 KYC，PayPal/Wise 门槛 **$20**。公开案例证明能赚，但是右偏、要维护、选词比写代码更决定结果。

---

## 1. 平台是什么（从文档和 API 爬到的）

### 1.1 产品形态

- **Actor** = 跑在 Apify 云上的无服务器程序：抓网页、自动化、当 API、当 MCP 工具。官方说明：像演员按剧本演，统一覆盖 scraping 和 automation。来源：[How Apify Store works](https://docs.apify.com/academy/actor-marketing-playbook/store-basics/how-store-works)
- **Store** = 公开可搜的货架。买家在 Store / Google / Apify MCP `search-actors` 里搜 `[站点] scraper`。
- **私有 Actor** 只有自己能跑；**公开 Actor** 上架才有流量和结款。
- 买家典型不是散户，是营销、招聘、增长、研究团队和写自动化的开发者。他们已经有账号。新用户每月约 **$5 免费额度**（官方营销文多次写过）。

### 1.2 今天货架有多大（现场 API，不是旧文）

`GET https://api.apify.com/v2/store?limit=1` 在 2026-08-27 返回：

| 字段 | 值 |
| --- | --- |
| `data.total` | **51,124** |

对比：reinventing.ai 转引「53,954 tools」；Apify 联盟页写「63,000+」。口径可能含未上架/私有/任务，**公开 Store 可搜约 5.1 万** 更可信。货架已经挤。

头部示例（同一 API 排序靠前）：

| Actor | 累计用户 | 近 30 天用户 | 定价 |
| --- | --- | --- | --- |
| `apify/instagram-scraper` | 376,480 | 41,261 | PPE，FREE 档约 $0.0027 / 条 |
| `compass/crawler-google-places`（Google Maps） | 578,352 | （同批请求里后续项） | PPE |

这些不是独立开发者能抢的词。

### 1.3 开发者怎么交付一个 Actor

官方路径（[Publish Actors](https://docs.apify.com/actors/publishing)）：

1. 用 [Apify CLI](https://docs.apify.com/cli/docs/installation) + [actor-templates](https://github.com/apify/actor-templates) 或 Crawlee / SDK 写代码（JS/Python/Go 都行）。
2. `INPUT_SCHEMA.json`、dataset schema、README、logo、分类、SEO title。
3. 上架时设 monetization。
4. 平台每天用**默认输入**测：5 分钟内必须成功跑起来。连续 3 天失败 → Under maintenance；再 28 天 → 废弃下架。来源：How Store works。
5. 建议每周留约 2 小时维护。Issue 公开，响应时间写在资料页上。

GitHub 官方仓库（现场 `gh search`）：`apify/apify-cli`、`apify/apify-sdk-python`、`apify/actor-templates`、`apify/apify-actor-docker`。社区大量 `*-scraper-ppe` 空壳仓库，星数为 0，说明「把 Actor 开源到 GitHub」本身不是流量。

### 1.4 质量分和搜索

[Actor quality score](https://docs.apify.com/actors/publishing/quality-score)：0–100，影响 **Store 搜索** 和 **MCP search-actors**。维度包括：可靠性、人气、评价、易用、定价透明、权限最小化、历史成功率、文案一致。一天算几次。

第三方 ApifyForge 声称 README 长度、schema、图标、成功率、PPE、分类、SEO 字段会加分。**官方没公布权重**，第三方数字当营销，不当硬指标。能确认的是：成功率、默认输入能跑、PPE、限权、README 清楚，官方自己点名。

### 1.5 给 AI 用的通道（2026 新变量）

- Store 搜索和 MCP 工具共用质量分逻辑。
- **Agentic payments**（x402 / Skyfire）：没 Apify 账号的 agent 也能发现并付。条件：PPE、**不能**「PPE+把算力转嫁给用户」、限权、开发者已 KYC。租用和纯 usage 的 Actor **进不了** agent 搜索。来源：[monetize](https://docs.apify.com/actors/publishing/monetize)
- 官方淘汰月租的理由之一：73% 买家更喜欢 PPE；MCP 不收录租用 Actor。来源：Apify 标准化定价博文 + reinventing.ai 转述。

对 SS 的含义：2026 年新 Actor 如果做租用或把 usage 转嫁出去，既拿不到 10-01 之后的收入，也在 agent 货架上隐形。

---

## 2. 钱怎么走（官方，可核对）

### 2.1 定价模型（现在只该用一个）

| 模型 | 状态（2026-08） | 开发者收入 |
| --- | --- | --- |
| **Pay per event (PPE)** | 主推、新 Actor 必选 | 付费用户事件费的 80%，再减本次平台成本 |
| Pay per result | 还在，官方在往 PPE 迁 | 同左 |
| Rental（月租） | **2026-03-31 起不能新挂/改价；2026-10-01 硬截止** | 未迁的自动变 pay-per-usage，**开发者收入归零** |
| Pay per usage / Free | 用户只付算力，开发者 0 | 0 |

公式（[PPE 文档](https://docs.apify.com/actors/publishing/monetize/pay-per-event)）：

`profit = 0.8 × revenue − platform_costs`

- `revenue` 只计**已经付钱的用户**触发的事件。免费档跑出来的条数**不算**你的收入。
- 单 Actor 某月算力 > 收入 → 该 Actor 利润记 **$0**，**不**拿别的 Actor 来填坑。来源：[monthly-payouts](https://docs.apify.com/actors/publishing/monetize/monthly-payouts)
- 可临时开「PPE + 把 usage 转给用户」方便试价，官方警告会伤定价透明和质量分，量产后应收进事件价。
- 合成事件：`apify-actor-start`（官方补贴前 5 秒算力，建议价 $0.00005/次）、`apify-default-dataset-item`（每条结果自动扣）。
- 涨价：每月最多一次，**14 天后生效**。降价立刻。来源：Publishing Terms 2.3；迁移博文也写了。
- 分层价（FREE/BRONZE/SILVER/GOLD/…）官方说能提高 Store 可见度；企业档要单独谈。

商店常见标价带：**$1–10 / 千条**（营销手册口径）。官方 PPE 示例：帖子 $0.002、画像 $0.005。

算力单价（开发者成本侧，FREE 档）：Compute $0.2/CU，住宅代理 **$8/GB**。来源：[pricing-and-costs](https://docs.apify.com/actors/publishing/monetize/pricing-and-costs)。反爬要吃代理时，毛利会被代理吃掉。

代码侧：JS/Python SDK `Actor.charge({ eventName })`，必须看 `eventChargeLimitReached` 再停，不要先批量 charge 再干活。本地测：`ACTOR_TEST_PAY_PER_EVENT`。

### 2.2 结款日历（Help Center，2026-07-20 更新）

来源：[How developer payouts work](https://help.apify.com/en/articles/10057167-how-developer-payouts-work) + monthly-payouts 文档。

| 日 | 事 |
| --- | --- |
| 1–10 | 算账。只纳入**已经付钱的合法用户** |
| 11 | 出票 |
| 11–14 | 你复核；不点也自动过 |
| 21–25 | 打款；银行再拖几天 |
| 30 还没到 | 找客服 |

门槛：

- PayPal、**Wise：$20**
- 其他（电汇等）：**$100**
- 不够就滚到下月。条款写：连续 12 个月不够门槛或 KYC 不过 → **视为放弃，归 Apify**。

KYC：Insights → Payouts → Verify identity。个人用证件原件高清照，别用截图。公司用注册名。没过 KYC **一张都不会打**。改账单信息（不只是收款方式）要重新 KYC。

扣款：买家因 Actor 坏了申请补偿，人工审过会从你发票扣。异常用量会暂停打款。

Creator 计划：约 **$1/月换 $500 测试额度**（Help「Make money publishing」）。自己跑测试也耗额度。

### 2.3 中国大陆收款（官方没写「能/不能」，只写通道）

官方通道：PayPal、Wise、电汇。没有「中国开发者禁止」的条款。也没有「人民币本地账户」。

未知、必须问朋友的：$27 实际进的是 PayPal、Wise，还是别的。PayPal 中国个人账户历史上经常收不到国际款；Wise 可以向国内银行卡汇人民币，但是要本人已开好 Wise。这是 **D0**，Cloud 代理测不了。

条款禁止在 README 里导到站外收款（微信/支付宝绕过平台）。违者可扣款下架。

### 2.4 官方敢说的收入区间（注意年份）

| 来源 | 说法 | 时间 |
| --- | --- | --- |
| Help: Make money publishing Actors | 最成功独立作者 **>$10,000/月**；不少 **>$1,000/月** | 文内写 Oct 22, 2025 |
| 旧博文 programmer-passive-income | 最成功 **>$4,000/月**；若干 >$1,000 | **2023 夏**，过时 |
| reinventing.ai 转引 partner 页 | 每月付给开发者约 **$1.4M / ~3000 人** → 人均约 **$470**，右偏 | 2026-07 文；**本次未能打开原始 partner 页核对**，当二手 |
| 联盟页 apify.com/partners/affiliate | 5k+ 联盟；和 Store 开发者结款不是同一件事 | 2026 |

「$1.4M / 3000」如果属实，均值被头部拉高，长尾大量 $0。**不能当 SS 的目标值，只能当「货架上真的有结算」。**

帮助文还写：平台**不会**因为别人跑你的 Actor 而向你倒扣；最差是该 Actor 利润为 0。

---

## 3. 上架、SEO、法律（会卡钱的细则）

### 3.1 README = 销售页 + Google 落地页

官方 [Actor README](https://docs.apify.com/actors/publishing/actor-readme)：前几句必须让人看懂拿什么数据、干什么用。H2/H3 带关键词。FAQ 吃长尾。配置放最后。

Help [SEO for Actors](https://help.apify.com/en/articles/2644024-seo-for-actors)：细节页吃 Google（例：「Kickstarter API」「Amazon crawler」）。过度堆砌会罚。内链到同类 Actor 和目标站。

### 3.2 自动化健康检查

默认输入 5 分钟跑通。登录墙、必须代理、启动就超过 5 分钟的 Actor，要找客服排除测试，否则会被标维护。**这直接打死「第一个 Actor 做 BOSS 直聘」**：那个站默认输入很难在无 cookie 下 5 分钟出活数据。

公开资料页展示：月活、星级、成功率、响应时间、上次更新。买家先看这些再点 Run。

### 3.3 法律（[Publishing Terms](https://docs.apify.com/legal/store-publishing-terms-and-conditions)，2026-02-20）

- 必须写 **unofficial、非官方、无隶属**。不准冒用商标当官方。
- 允许功能竞争，禁止抄别人 README/描述。
- 禁止刷评、禁止站外收款。
- 发布即允许 Apify 在合规调查时看源码。
- 你有维护义务。Faulty 超过约 30 天可弃用且不赔。Issue 14 天不处理可被标 Faulty。urgent 邮件 3 个工作日要回。
- 满 18 岁。

招聘站、带个人信息的抓取，还受 Acceptable Use / 隐私政策约束。官方条款没写「禁止招聘站」，但审查和补偿风险更高。

---

## 4. 现场货架抽查（2026-08-27 Store API）

搜索接口：`/v2/store?search=`。数字是 `total`（相关度召回，含脏匹配）和前几条的真实月活。

| 查询 | API total | 实际相关供给（人工看前排） | 判断 |
| --- | --- | --- | --- |
| `linkedin scraper` | 8,847 | HarvestAPI 10,806 月活；Curious Coder Jobs 14,128 月活 | **禁区** |
| `xiaohongshu` | 205 | Zen Studio / SIÁN 月活 55–733 | **已占** |
| `vinted` | 322 | 多条 PPE，月活 12–74 | 拥挤，新入口难 |
| `welcome to the jungle` | 135 | `clearpath` 117 月活；另有 logiover、shahidirfan 等 | **98-actors 文里的空位已经没了** |
| `skool` | 251 | memo23 帖子 56 月活 / 1039 累计 | 不再是空位 |
| `leboncoin` | 143 | clearpath / fatihtahta 月活 22–85 | 有人做 |
| `jora` | 很大（脏匹配） | 真正 Jora 刮子月活个位数到 36，有一条 FREE | 小 |
| `liepin` / `51job` / `zhaopin` | 12–45 | GetAScraper 等月活 2–6 | 有货、几乎没人用 |
| `boss zhipin` / `boss zhipin scraper` | **0** | 直达页仍在，见下 | 搜索发现为 0 |
| `dianping` / `meituan` / `大众点评` | 脏匹配为主 | **没有**像样的专用商户 Actor | 空，但是反爬 |
| `zhipin` | 5 | 前排不相关 | 词没人搜或搜不到 |

**BOSS 直聘直达页仍在**：https://apify.com/saswave/boss-zhipin-scraper  
现场抓到的公开指标：**累计 53 用户、月活 0、成功率 0%、1 星、$25/月租 + usage**。Store 搜索 `boss zhipin` 返回 0，等于这个坏货在货架搜索里是隐形的。两种读法：① 有空位；② 英文买家根本不搜这个词，所以也排不上。Claude 上次主张 ②。本次搜索 0 不能当「有人在搜」。

Xiaohongshu 侧证：Zen Studio RedNote search **733 月活**，评论刮子 **515 月活**。中文社交不是没人买，是工厂已经占了「小红书」这个词。

Naver Place：Apify 自己 Rising Stars 点名过；Store 里已有月活 30+ 的评论刮子。韩国本地生活也不是蓝海。

---

## 5. GitHub + 谷歌上的赚钱经验（独立于官方营销）

下面只收**带数字或可核对操作**的分享。纯「被动收入教程」且还在教月租的，标过时。

### 5.1 Olivier Reynaud · 98 个 Actor / 6 个月（Apify 官方博客，第一人称）

来源：https://blog.apify.com/building-98-actors-on-apify-store/

**他交出的可核对指标（没公布收入）：** 98 个公开 Actor，2,500 总用户，855 月活，成功率 98.8%，issue 均响 6.2 小时。每周 15–20 小时。

时间线：

- 月 1–2：上架，每周个位数 run，时间花在 schema/定价。
- 月 3–4：双位数用户，PPE 变体明显好过按算力。
- 月 5–6：目录效应，买了 A 的人点进主页买 B。

关键实验（同一数据两套定价）：Welcome to the Jungle **标准 3 用户 vs PPE 38**（12.7×）。ZipRecruiter 2 vs 25。11 对里 10 对 PPE 赢。

选词：不要打 LinkedIn/Amazon/Instagram（每站 5–15 个竞品含官方）。要 **有搜索、供给差** 的区域/垂直。他押房地产，赢的是 WTJ、Skool、Storeleads、ZipRecruiter、Airbnb 专业房东。

工程：Go + **只 HTTP、无无头浏览器**（算力低一个数量级，才能把 PPE 标低还留毛利）。模板复制，每 Actor 每周平均约 10 分钟。上线前在 Apify 基建上 Staging 48 小时——他有一次笔记本通、生产空输出，吃了一星，流量几周起不来。

README：用例一句 → 样例 JSON → 配置放最后。技术说明书没人跑。

**对 2026-08 的折扣：** 他写文时 WTJ/Skool 还是空位。今天 Store 里这两词已经有月活过百的竞品。方法还在，**具体词过期了**。

### 5.2 DEV.to · 第一个 Actor 三个月 · Vinted · ~$200/月

来源：https://dev.to/boo_n/3-months-shipping-my-first-apify-actor-64-users-200mo-and-everything-i-got-wrong-52i7

| 指标 | 值 |
| --- | --- |
| 上线 | 2026-02 |
| 累计用户 | 64 |
| 月活 | 13 |
| 近 30 天收入 | **~$200**（自称扣 20% 后） |
| 成功率 | 212/230 = 92% |
| 外发文章 | 28 篇，**总浏览 76**，多数 0 |

教训：

- 外发博客几乎带不来 Store 流量。货架自己的搜索/Google 才是渠。
- 最大技术坑：run 显示成功但 0 条。最大修复：住宅代理国籍对齐目标站，成功率 60%→95%。
- 最大定价错误：每 run 起步 **$0.30**。58% 的 run 低于 25 条，有效单价 $13.60/千条，远高于市面 $0.50–$3.50。小监控客户被价格吓跑。
- 作者对市面的观察（非官方）：多数付费 Actor **$50–500/月**；头部 **$5k–30k**。自己 $200 是因为分发弱。

GitHub 配套：文内写 `github.com/Boo-n/vinted-turbo-scraper`。Store 上 `kazkn/vinted-turbo-scraper` 月活 12。Vinted 词已经卷。

### 5.3 DEV.to · 45 个刮子、600 用户、$0 广告

来源：https://dev.to/the_aientrepreneur_7ae85/45-scrapers-600-users-0-marketing-budget-what-actually-worked-5h0o

自称：45 个 Actor，约 600 用户，1 万+ runs，零广告。栈：Node + Crawlee + Puppeteer + PPE。

他说有效的：技术文（不是软文）、GitHub README、把 Actor 做便宜。

他自己的反悔：**先做 5 个不要 45 个**。用户集中在 3 个工具，长尾只是门面。定价比功能重要，最好卖的是最便宜的，**$0.002–0.005 / 条**。

没公布美元收入。600 用户可以几乎全是免费额度。**当「铺量有效」证据不足，当「别铺 45 个」的自白足够。**

### 5.4 ApifyForge / reinventing.ai（工具商 + 课程商，有利益）

- ApifyForge：管 50+ Actor 的人写「杀了 30 个零 run 的」、质量分、组合分析。声称 top 10% 开发者 >$5,000/月——**无原始数据，当广告**。
- reinventing.ai（2026-07-30）：把 $1.4M/3000≈$470 算清楚了；强调旧教程还在教月租，而月租 10-01 作废；主张做 **agent 能调用的窄动作**，input schema 就是给模型看的文档。作者明确说**不公布自己的 Actor 收入**。有卖课动机，数字部分能对上官方，建议部分要打折。

### 5.5 GitHub 现场

`gh search repos "apify actor"` 前排几乎全是官方 SDK/CLI/模板，或垂直刮子（Zillow、Booking、Kickstarter）——那些是 **2016–2024 的老 Actor 源码**，不是 2026 赚钱教程。

能当「经验附件」的：

- 官方模板：https://github.com/apify/actor-templates
- SDK 里的 `Actor.charge`：https://github.com/apify/apify-sdk-js 、`apify/apify-sdk-python`
- `isolovyev77/apify-agent-friendly-actors`：怎么让 Actor 被 agent 调用（三态输出、先 charge 再写库）
- 大量 `*-scraper-ppe` 0 星复制品：说明开源仓库 **不是** 获客主路径；Store 页才是。

Reddit / IndieHackers：本次检索 `site:reddit.com Apify store earnings` **0 条可用结果**（工具侧无命中）。公开讨论几乎都在官方博客和 DEV.to。

### 5.6 朋友那条线（微信截图，此前已核，不重复爬）

17 个 Actor，三个进账：tiktok-scraper $19.56、tiktok-hashtag-stats $6.32、tiktok-influencer-finder $1.11，IG 接近 0。合计约 $27。Clockworks TikTok Scraper 现场相关页仍是 **约 17 万用户量级**。朋友是在被占的词里捡漏。方法（货架+PPE）对，词错。

---

## 6. 把经验压成可执行的规律（供复议，不是拍板）

重复出现、且能对上官方机制的：

1. **冷启动靠 Store 搜索 + Google 索引 Actor 页，不靠微信、不靠发 28 篇博客。** Vinted 作者 28 文 76 浏览是反证。
2. **只做 PPE。** 月租 10-01 归零；98-actors 的对照表 PPE 高一个数量级用户。
3. **价要按买家单位标**（千条 $1–10 或每条 $0.002–0.005），不要 $0.30 起步费。涨价有 14 天锁。
4. **先测平台成本再定价。** 住宅代理 $8/GB，反爬站可能利润为 0。
5. **默认输入必须 5 分钟跑通。** 空成功 = 一星 = 死亡。Staging 48 小时。
6. **不要打 TikTok/IG/LinkedIn/Amazon/小红书。** 现场月活是 4–5 位数。
7. **区域空位会过期。** WTJ/Skool 在 98-actors 文里是样板，今天已经有月活过百的供给。
8. **前几个月是个位数 run。** 用 14 天「≥5 陌生 run」当换词信号合理；用 14 天「≥1 笔结算」当换词信号会被审核/账期误伤（Claude 上次要 AND，Grok 反对）。
9. **维护不是被动。** 官方 2h/周是下限；98-actors 是 15–20h/周管目录。成功率公开。
10. **KYC + PayPal/Wise 是结款前提。** 没过 = 做了也拿不到。连续 12 个月不够 $20 或不过 KYC，条款写放弃。

本次新发现、计划里还没写死的：

- Store 公开可搜 **51,124** 个，比心里「几千个工具」挤一个数量级。
- **MCP/agent 货架** 只收干净 PPE；这是 2026 的第二条分发，不只是人类买家。
- BOSS 直聘 Actor 在 Store **搜索召回为 0**，不能解释成「有人搜这个词」。
- WTJ 已经不是空位，**不能把 98-actors 的词表当候选池**。
- 中文站不是完全没买家（小红书月活数百），但那是工厂词。

---

## 7. 仍未知（不要编）

1. `$1.4M / ~3000` 原始 partner 页本次打不开，未核原文。
2. SS 能否用 PayPal 或 Wise 收到美元/人民币。必须问朋友 $27 怎么到账。
3. 15 词表还没做完。现场只抽查了计划里提过的词 + 几个英文对照。
4. Reddit 无命中，可能是检索限制，不代表没人讨论。
5. GitHub MCP 本环境不可用，仓库搜索走的 `gh` CLI。

---

## 8. 主要出处（复议时按这个点）

- Store 规模与竞品：`https://api.apify.com/v2/store` 2026-08-27
- PPE / 成本 / 结款：docs.apify.com `pay-per-event`、`pricing-and-costs`、`monthly-payouts`
- 打款日历：help.apify.com/en/articles/10057167
- 赚钱帮助页：help.apify.com/en/articles/8684010
- 质量分 / Store 机制：docs quality-score、how-store-works
- 法律：docs.apify.com/legal/store-publishing-terms-and-conditions
- 月租退市：blog.apify.com/standardizing-actor-pricing/ 、migrating-to-pay-per-event-pricing/
- 98-actors：blog.apify.com/building-98-actors-on-apify-store/
- Vinted $200：dev.to/boo_n/3-months-shipping-my-first-apify-actor-64-users-200mo-and-everything-i-got-wrong-52i7
- 45 scrapers：dev.to/the_aientrepreneur_7ae85/45-scrapers-600-users-0-marketing-budget-what-actually-worked-5h0o
- 人均算术（二手）：reinventing.ai/blog/apify-actor-passive-income
- BOSS 直聘直达：apify.com/saswave/boss-zhipin-scraper
- CLI：docs.apify.com/cli/docs/installation
- 官方代码：github.com/apify/actor-templates 、apify-cli 、apify-sdk-js 、apify-sdk-python
