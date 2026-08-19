import type { CapacitorConfig } from '@capacitor/cli'

/** 开发时用 CAP_SERVER_URL 让模拟器/真机直接加载 Vite，避免每次改代码都重编原生。 */
const liveUrl = process.env.CAP_SERVER_URL?.trim()

const config: CapacitorConfig = {
  appId: 'com.stockmonitor.app',
  appName: 'Stock Monitor',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#F2F2F7',
  },
  server: {
    androidScheme: 'https',
    ...(liveUrl
      ? {
          url: liveUrl,
          cleartext: true,
        }
      : {}),
  },
}

export default config
