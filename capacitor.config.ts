import type { CapacitorConfig } from '@capacitor/cli'

/**
 * iOS 是薄壳：产品功能在 React 里改，不要在 Swift 里复制页面。
 * Web 还没定型时，用 CAP_SERVER_URL 让模拟器直接加载 Vite，避免每次改清单都重编原生。
 */
const liveUrl = process.env.CAP_SERVER_URL?.trim()

const config: CapacitorConfig = {
  appId: 'com.stockmonitor.app',
  appName: '到价提醒',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#F2F2F7',
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    ...(liveUrl
      ? {
          url: liveUrl,
          cleartext: true,
        }
      : {}),
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'LIGHT',
    },
  },
}

export default config
