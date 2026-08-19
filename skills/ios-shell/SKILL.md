---
name: ios-shell
description: |
  iOS / Capacitor / Xcode / 模拟器 / App Store 壳。改 ios/、capacitor.config、nativeInit、platform 时用本 skill。禁止在 Swift 里复制行情、价值清单、财报、资讯页面；网页功能还没做完，原生只留壳和余量。
---

# iOS 薄壳

收费产品的功能在 **React**。iOS 只负责启动 WebView、状态栏、安全区、回前台、以及原生 HTTP（绕开 CORS）。

网页版还没做完。改 iOS 时必须留修改余量：

1. **不要**为清单、财报、快讯、持仓、提醒单独写 Swift UI。
2. **不要**把当前 Web 信息架构焊进 `UITabBarController`。底部 Tab 在 `src/components/layout/TabBar.tsx`。
3. 新能力先落在 `src/`。只有 Web 做不到的系统能力（推送权限、后台刷新、Keychain）才加 Capacitor 插件。
4. 日常联调用 `CAP_SERVER_URL` 指向 Vite，改 Web 不必 `cap sync`。只有改了原生配置才重编 Xcode。

## 两种运行方式

| 方式 | 何时 | 命令 |
|---|---|---|
| 热加载 | Web 还在改 | Mac 上 Vite `host: true`，然后 `CAP_SERVER_URL=http://<局域网IP>:5173 npx cap sync ios` |
| 打包进 App | 要看离线包 / 提测 | `npm run ios:build`（会 `vite build` + `cap sync`） |

`capacitor.config.ts` 读环境变量 `CAP_SERVER_URL`。不要把开发机 IP 写进仓库。

## 网络

- 浏览器：没有 CORS 的源只走 Vite 代理；静态部署走 datacenter / 华尔街见闻 / 同花顺。
- iOS 已开 `CapacitorHttp`：打包后的 `fetch` 走原生，东财快讯、财联社、emweb F10 可以直连。
- 热加载时 Web 仍是 Vite DEV，优先走 `/em-*` `/cls` 代理。

## 硬禁令

1. 不在 `AppDelegate` 里实现产品页面。
2. 不把「巴菲特 / 价值清单」做成原生模块。
3. 不跟登录态爬雪球。
4. 不把模拟器 UDID 写死进 `package.json`。
