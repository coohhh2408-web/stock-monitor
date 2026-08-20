# 到价提醒（网页定型版 2026.08.20）

个人股票监控。**网页已经定型**，这份就是正式版；后面只修线上问题，不再并行改产品。iOS 仍是薄壳，跟着这份网页走。

**正式站：** https://coohhh2408-web.github.io/stock-monitor/

打开即可，不需要注册，也不需要自建后端。数据仅供参考，不构成投资建议。

## 定型范围

已经冻进这一版：

- 行情货架看板、打击区、7×24 快讯
- 价值选股（按习惯市盈率带过滤，不是荐股池）
- 来电掩护到价提醒（区内只响一次，接听才看到股价）
- 看板止盈止损（相对现价的绝对价位）
- 价值清单八道关（缺数据标未知，不是巴菲特荐股）
- K 线拖动缩放

明确不做、也不在这版里改：

- 按成本价 / ATR 的止盈止损改写
- 清单到价建议
- App Store 图标、推送、后台刷新

## 网页上线

把 `dist/` 丢到任意静态托管就是线上地址。行情走腾讯脚本直连，选股 / K 线走东财公开接口，**生产环境不依赖 Vite 代理**。

```bash
npm install
npm test
npm run build
npm run preview   # 本机核对 http://localhost:4173
```

仓库已带 `netlify.toml`、`vercel.json`、SPA 回退。连接托管后：

| 平台 | 构建命令 | 发布目录 |
| --- | --- | --- |
| Cloudflare Pages / Netlify / Vercel | `npm run build` | `dist` |
| GitHub Pages | 打开仓库 Actions「网页定型版」，Pages 源选 GitHub Actions | 自动 |

当前正式站就是 GitHub Pages：https://coohhh2408-web.github.io/stock-monitor/ 。工作流会设置 `VITE_BASE=/stock-monitor/`。根域名托管不要设这个变量。

- 行情：腾讯财经（浏览器直连）+ 东方财富备用
- 到价：区内只响一次；弹窗是来电掩护，接听才看到股价
- 选股：按习惯市盈率带过滤，不是荐股池
- 价值清单：八道关，缺数据标未知
- `?mobile=1#push`：手机框里预览到来电提醒

## 现在请在 Mac 本机看 iOS 壳

云环境没有 Xcode。网页定型后，原生不要再复制功能：

```bash
git fetch origin
git checkout cursor/web-release-6f09
npm install
npm run ios:local
```

真机：`npm run ios:device`。改 `src/` 保存即可在 App 里看到。

## 真实行情

- 交易时段约 5 秒刷新，收盘后自动降频
- 顶部会显示「交易中 / 已收盘」和最近刷新时间
- 分享链接把快照编进 URL（`#/share/d/...`），无需后端
- 快讯优先华尔街见闻（带 CORS）；东财 / 财联社在纯静态站可能拉不到，属预期

## 云端多端同步（可选）

在 **设置 → 云端多端同步** 中启用，可在 iPhone / Mac / Web 之间同步自选、持仓、做T 和提醒。

**方式 A — 自动**

1. 打开 https://supabase.com/dashboard/account/tokens 生成 Access Token
2. 运行：`SUPABASE_ACCESS_TOKEN=sbp_xxx npm run setup:supabase`

**方式 B — 手动**

1. 在 Supabase SQL Editor 执行 [`supabase/schema.sql`](supabase/schema.sql)
2. 复制 Project URL 和 anon key
3. `npm run setup:env -- https://xxx.supabase.co eyJhbG...`

设备 A 复制同步码，设备 B 填同一组码和 PIN。数据经 AES-GCM 客户端加密后上传。

## iOS 壳（Capacitor）

网页功能已定型。iOS **不要复制**行情 / 价值清单 / 财报 / 资讯，只包 WebView。

细则见 [`skills/ios-shell/SKILL.md`](skills/ios-shell/SKILL.md)。

### 还没做（原生）

- App Store 图标 / 启动图定稿
- 推送、后台刷新
- 加密同步的出口合规勾选
