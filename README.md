# Stock Monitor

Apple Stocks 风格的个人股票行情监控 — **Web + iOS 原生**双端。

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

## iOS 端（Capacitor + Swift Package Manager）

### 环境要求

- macOS + **Xcode 15+**（含 iOS Simulator）
- 无需 CocoaPods（项目使用 SPM）

### 首次构建

```bash
cd ~/Projects/stock-monitor
npm install
npm run ios:add      # 仅首次：生成 ios/ 工程（SPM 模板）
npm run ios:build    # 构建 Web + 同步到 ios/
npm run ios:open     # 用 Xcode 打开工程
```

在 Xcode 中：
1. 选择目标设备（如 **iPhone 17** 模拟器）
2. 点击 ▶ Run

或直接命令行运行：

```bash
npm run ios:run      # 构建 + 启动 iPhone 17 模拟器
```

### 日常开发（热加载，推荐）

一条命令拉起模拟器；没有 Vite 时会自动在后台启动：

```bash
npm run ios:local    # 模拟器 → http://127.0.0.1:5173
npm run ios:device   # 真机（同一 Wi-Fi）→ 局域网 IP，再在 Xcode 里选手机 Run
```

改 `src/` 保存即可在 App 里看到，不必每次重编原生。

也可以手动开两个终端：

```bash
npm run dev          # Web 热更新调试
CAP_SERVER_URL=http://127.0.0.1:5173 npm run ios:live   # 另开终端，sync 后打开 Xcode
```

### 打包进 App（离线包 / 提测）

```bash
npm run ios:build    # vite build + cap sync，不带 CAP_SERVER_URL
npm run ios:open     # 或 npm run ios:run 直接启动模拟器
```

### iOS 特性

- 底部 Tab 栏（行情 / 持仓 / 提醒）— 对齐 Apple Stocks
- Safe Area 适配（刘海 / Home Indicator）
- 个股详情 **底部 Sheet** 弹出（非居中弹窗）
- 状态栏浅色样式
- 与 Web 共享同一套 React 代码与 localStorage 数据逻辑

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
