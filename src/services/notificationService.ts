import type { BarkSettings, DesktopAlertSettings, IncomingCallPayload } from '@/types/alert'
import { notifyTap } from '@/lib/nativeInit'

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

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

/** 接近 iOS 默认「三声音」的短提示，音量压低，避免办公室里像炒股软件。 */
export function playIosTriTone(): void {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    const notes = [587.33, 880, 1174.66]
    const startAt = ctx.currentTime + 0.02
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const sparkle = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      sparkle.type = 'triangle'
      osc.frequency.value = freq
      sparkle.frequency.value = freq * 2
      osc.connect(gain)
      sparkle.connect(gain)
      gain.connect(ctx.destination)

      const t0 = startAt + i * 0.18
      const t1 = t0 + 0.14
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t1)
      osc.start(t0)
      sparkle.start(t0)
      osc.stop(t1 + 0.01)
      sparkle.stop(t1 + 0.01)
    })
  } catch {
    // optional
  }
}

export function deliverDesktopAlert(
  desktop: DesktopAlertSettings,
  title: string,
  body: string,
  incoming?: IncomingCallPayload | null,
): void {
  const stealth = Boolean(desktop.popupAlert && incoming)

  if (desktop.systemBanner && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(stealth && incoming ? incoming.coverName : title, {
      body: stealth ? '来电' : body,
      silent: true,
    })
  }

  if (desktop.popupAlert && incoming) {
    window.dispatchEvent(new CustomEvent<IncomingCallPayload>('stock-monitor:incoming-call', { detail: incoming }))
  }

  if (desktop.alarmSound) {
    playIosTriTone()
    void notifyTap()
  }

  if (desktop.ttsVoice && !stealth && 'speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(`${title}。${body}`)
    utter.lang = 'zh-CN'
    utter.rate = 1.1
    window.speechSynthesis.speak(utter)
  }
}

export function previewIncomingCall(): void {
  const incoming: IncomingCallPayload = {
    id: `preview-${Date.now()}`,
    coverName: '吴女士',
    coverLine: '手机  138****6621',
    title: '到价提醒预览',
    body: '接听后才显示股价正文。办公室里看起来像一通普通来电。',
  }
  deliverDesktopAlert(
    { systemBanner: false, alarmSound: true, ttsVoice: false, popupAlert: true },
    incoming.title,
    incoming.body,
    incoming,
  )
}
