import { Keyboard } from '@capacitor/keyboard'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'

export const APP_RESUME_EVENT = 'app-resume'

export async function lightTap(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    /* web or simulator without haptics */
  }
}

export async function notifyTap(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch {
      /* web or simulator without haptics */
    }
  }
}

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
    // optional on web preview
  }

  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: false })
  } catch {
    /* plugin missing in web */
  }

  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) window.dispatchEvent(new Event(APP_RESUME_EVENT))
  })
}
