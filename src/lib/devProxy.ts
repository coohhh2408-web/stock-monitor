import { Capacitor } from '@capacitor/core'

/** Vite 开发服上的 /em-* /cls 代理，跟页面是不是 5173 端口无关（隧道/局域网同样有效）。 */
export function usesDevProxy(): boolean {
  return import.meta.env.DEV
}

/** 打包进 iOS 后，CapacitorHttp 走原生网络，不受浏览器 CORS 限制。 */
export function usesNativeHttp(): boolean {
  return Capacitor.isNativePlatform()
}

/** 开发代理或 iOS 原生 HTTP，才能打没有 CORS 的东财快讯 / 财联社等。 */
export function canBypassBrowserCors(): boolean {
  return usesDevProxy() || usesNativeHttp()
}
