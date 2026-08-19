import { Capacitor } from '@capacitor/core'

export function isNativeIOS(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}
