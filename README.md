# Stock Monitor

Apple Stocks 风格的个人股票行情监控 — **Web + iOS 原生**双端。

## 现在请在 Mac 本机开发

云环境没有 Xcode，iOS 必须在本地跑。拉带网页最新改动的分支：

```bash
git fetch origin
git checkout cursor/ios-native-shell-6f09
git pull origin cursor/ios-native-shell-6f09
npm install
```

两个终端也可以，一条命令更省事：

```bash
npm run ios:local    # 没有 Vite 会自己拉起，然后 cap run 打开模拟器
```

iPhone 真机（同一 Wi-Fi）：`npm run ios:device`，再在 Xcode 里选手机点 Run。

改 `src/` 保存即可在 App 里看到。不要在 Swift 里复制行情 / 清单 / 财报。网页功能还没做完，原生只留壳。


## 真实行情（可直接给别人用）

打开网页即可，**不需要注册、不需要自建后端**。

- 行情源：腾讯财经（主，浏览器可直连）+ 东方财富（备用）
- 搜索：全市场代码 / 名称（A股、港股、美股）
- 交易时段约 5 秒刷新，收盘后自动降频，避免把接口打满
- 顶部状态会显示「交易中 / 已收盘」和最近刷新时间
- 数据可能有数秒延迟，**仅供参考，不构成投资建议**

别人怎么用：

```bash
npm run build && npm run preview   # 本机分享 preview 地址
# 或把 dist/ 部署到任意静态托管（Cloudflare Pages / Vercel / GitHub Pages）
```

分享链接将行情/持仓/提醒快照 gzip 压缩后编码进 URL（`#/share/d/...`），可在任意设备打开，无需后端。

## 云端多端同步（可选）

在 **设置 → 云端多端同步** 中启用，可在 iPhone / Mac / Web 之间同步自选、持仓、做T 记录和提醒规则。

### 一次性配置（部署者操作）

**方式 A — 自动（推荐）**

1. 打开 https://supabase.com/dashboard/account/tokens 生成 Access Token
2. 运行：

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npm run setup:supabase
```

脚本会自动创建项目、执行 schema、写入 `.env`。

**方式 B — 手动（已有项目）**

1. 在 Supabase SQL Editor 执行 [`supabase/schema.sql`](supabase/schema.sql)
2. 从 Project Settings → API 复制 URL 和 **anon public** key
3. 运行：

```bash
npm run setup:env -- https://xxx.supabase.co eyJhbG...
npm run verify:sync
npm run dev
```

### 使用方式（无需注册账号）

1. 设备 A：设置 → 启用云端同步 → 复制**同步码**（可设 PIN 加密）
2. 设备 B：输入相同同步码和 PIN → 点击「立即同步」
3. 之后约 **30 秒自动同步**；本地修改后 3 秒内自动上传

数据经 **AES-GCM 客户端加密** 后存入 Supabase，安全性依赖同步码 + 可选 PIN。

## Web 端

```bash
npm install
npm run dev          # http://localhost:5173
```

## iOS 端（Capacitor 薄壳）

网页功能还没做完。iOS **不要复制**行情 / 价值清单 / 财报 / 资讯页面，只包一层 WebView。改产品先改 `src/`，原生只留余量。

细则见 [`skills/ios-shell/SKILL.md`](skills/ios-shell/SKILL.md)。

### 环境要求

- macOS + **Xcode 15+**（含 iOS Simulator）
- 无需 CocoaPods（SPM）

### 日常：Web 还在改时（推荐）

模拟器直接加载 Vite，改清单和财报不必重编原生：

```bash
npm install
npm run dev          # vite 已 host: true，手机/模拟器走局域网
# 另开终端，把 IP 换成 Mac 的局域网地址
CAP_SERVER_URL=http://192.168.1.12:5173 npm run ios:live
```

在 Xcode 选模拟器或真机 Run。第一次需要信任开发者证书。

### 打包进 App（离线包 / 提测）

```bash
npm run ios:build    # vite build + cap sync，不带 CAP_SERVER_URL
npm run ios:open
# 或
npm run ios:run      # 同步后让 Capacitor 列出可用模拟器
```

不要把开发机 IP 或模拟器 UDID 写进仓库。

### iOS 壳现在有什么

- 桌面名「到价提醒」，与网页同一套 React
- `CapacitorHttp`：打包后可直连没有 CORS 的东财快讯 / 财联社
- 回前台时刷新行情
- Safe Area、浅色状态栏
- 隐私清单占位（还不上架）

### 还没做（等网页定型）

- App Store 图标 / 启动图定稿
- 推送、后台刷新
- 加密同步的出口合规勾选（现在用了 AES-GCM，不要擅自声明「只用豁免加密」）

## 项目结构

```
src/
├── components/layout/TabBar.tsx   # iOS 底部导航
├── lib/platform.ts                # 原生平台检测
├── lib/nativeInit.ts              # Capacitor 初始化
ios/                               # Xcode 工程（SPM）
```

## 后续

- [x] 接入真实行情（东方财富 / 腾讯，无需后端）
- [x] 分享链接跨设备（快照 gzip 编码进 URL，无需后端）
- [x] 云端多端同步（Supabase + 客户端加密）
- [ ] App Store 上架配置（图标、启动屏、隐私说明）
- [ ] 等网页功能定型后再加原生推送 / 后台刷新，不提前焊死信息架构
