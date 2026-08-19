import type { BarkSettings, DesktopAlertSettings } from '@/types/alert'

const BARK_LEVEL_PARAM: Record<string, string> = {
  active: 'active',
  timeSensitive: 'timeSensitive',
  passive: 'passive',
  critical: 'critical',
}

export async function sendBarkPush(
  bark: BarkSettings,
  title: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!bark.enabled || !bark.key.trim()) {
    return { ok: false, error: 'Bark 未启用或未填写 Key' }
  }

  const key = bark.key.trim()
  const level = BARK_LEVEL_PARAM[bark.level] ?? 'active'
  const params = new URLSearchParams()
  params.set('level', level)
  if (bark.persistentRing) params.set('call', '1')

  const url = `https://api.day.app/${encodeURIComponent(key)}/${encodeURIComponent(title)}/${encodeURIComponent(body)}?${params}`

  try {
    const res = await fetch(url, { method: 'GET', mode: 'no-cors' })
    // no-cors returns opaque response; treat as sent if no throw
    void res
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '推送失败' }
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function deliverDesktopAlert(
  desktop: DesktopAlertSettings,
  title: string,
  body: string,
): void {
  if (desktop.systemBanner && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }

  if (desktop.popupAlert) {
    // eslint-disable-next-line no-alert
    window.alert(`${title}\n\n${body}`)
  }

  if (desktop.alarmSound) {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.value = 0.08
      osc.start()
      setTimeout(() => {
        osc.stop()
        void ctx.close()
      }, 200)
    } catch {
      // optional
    }
  }

  if (desktop.ttsVoice && 'speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(`${title}。${body}`)
    utter.lang = 'zh-CN'
    utter.rate = 1.1
    window.speechSynthesis.speak(utter)
  }
}
