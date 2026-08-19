import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export async function initNativeApp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  document.documentElement.classList.add('native-app')
  if (Capacitor.getPlatform() === 'ios') {
    document.documentElement.classList.add('ios-native')
  }

  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (Capacitor.getPlatform() === 'ios') {
      await StatusBar.setOverlaysWebView({ overlay: true })
    }
  } catch {
    // optional
  }
}
