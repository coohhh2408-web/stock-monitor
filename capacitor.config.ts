import type { CapacitorConfig } from '@capacitor/cli'

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
  },
}

export default config
