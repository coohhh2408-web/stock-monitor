import { Toggle } from '@/components/ui/Toggle'
import { useToast } from '@/components/ui/Toast'
import { ShareViewButton } from './ShareViewButton'
import type { BarkSettings, DesktopAlertSettings, BarkLevel, ShareViewStub } from '@/types/alert'

interface NotificationPanelProps {
  bark: BarkSettings
  desktop: DesktopAlertSettings
  variant?: 'inline' | 'sidebar'
  onBarkChange: (s: Partial<BarkSettings>) => void
  onDesktopChange: (s: Partial<DesktopAlertSettings>) => void
  onTestPush: () => void
  onShare?: () => Promise<ShareViewStub>
}

const BARK_LEVELS: { value: BarkLevel; label: string }[] = [
  { value: 'critical', label: 'critical' },
  { value: 'active', label: 'active' },
  { value: 'timeSensitive', label: 'timeSensitive' },
  { value: 'passive', label: 'passive' },
]

export function NotificationPanel({
  bark,
  desktop,
  variant = 'inline',
  onBarkChange,
  onDesktopChange,
  onTestPush,
  onShare,
}: NotificationPanelProps) {
  const isSidebar = variant === 'sidebar'
  const { showToast } = useToast()
  const rowClass = isSidebar ? 'flex items-center justify-between py-1.5' : 'inset-row'

  if (!isSidebar) {
    return (
      <div className="space-y-5">
        <div>
          <p className="inset-group-header">iPhone Bark 推送</p>
          <div className="inset-group">
            <div className={rowClass}>
              <span className="text-sm text-neutral-900">启用 Bark</span>
              <Toggle checked={bark.enabled} onChange={(v) => onBarkChange({ enabled: v })} label="" />
            </div>
            <div className="inset-row flex-col !items-stretch gap-1">
              <label className="text-xs text-neutral-400">Bark Key</label>
              <input
                type="text"
                value={bark.key}
                onChange={(e) => onBarkChange({ key: e.target.value })}
                placeholder="设备 Key"
                disabled={!bark.enabled}
                className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none disabled:opacity-40"
              />
            </div>
            <div className="inset-row flex-col !items-stretch gap-1">
              <label className="text-xs text-neutral-400">报警级别</label>
              <select
                value={bark.level}
                onChange={(e) => onBarkChange({ level: e.target.value as BarkLevel })}
                disabled={!bark.enabled}
                className="w-full bg-white/80 text-sm text-neutral-900 rounded-lg px-2 py-1.5 border border-black/[0.06] focus:outline-none disabled:opacity-40"
              >
                {BARK_LEVELS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className={rowClass}>
              <span className="text-sm text-neutral-900">持续响铃 30s</span>
              <Toggle
                checked={bark.persistentRing}
                onChange={(v) => onBarkChange({ persistentRing: v })}
                label=""
              />
            </div>
            <div className="inset-row">
              <button
                onClick={() => void onTestPush()}
                disabled={!bark.enabled || !bark.key}
                className="text-sm text-[#007AFF] w-full text-left disabled:opacity-40"
              >
                发送测试推送
              </button>
            </div>
            {'Notification' in window && Notification.permission !== 'granted' && (
              <div className="inset-row">
                <button
                  onClick={() => void Notification.requestPermission()}
                  className="text-sm text-[#007AFF] w-full text-left"
                >
                  授权浏览器通知
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="inset-group-header">电脑端提醒</p>
          <div className="inset-group">
            {([
              ['systemBanner', '横幅通知'],
              ['alarmSound', '警报声'],
              ['ttsVoice', '语音播报'],
              ['popupAlert', '弹窗强提醒'],
            ] as const).map(([key, label]) => (
              <div key={key} className={rowClass}>
                <span className="text-sm text-neutral-900">{label}</span>
                <Toggle checked={desktop[key]} onChange={(v) => onDesktopChange({ [key]: v })} label="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="info-card space-y-3">
        <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <span className="text-base">📱</span> iPhone Bark 推送
        </p>
        <div className={rowClass}>
          <span className="text-sm text-neutral-900">启用 Bark</span>
          <Toggle checked={bark.enabled} onChange={(v) => onBarkChange({ enabled: v })} label="" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Bark Key</label>
          <input
            type="text"
            value={bark.key}
            onChange={(e) => onBarkChange({ key: e.target.value })}
            placeholder="设备 Key"
            disabled={!bark.enabled}
            className="w-full px-3 py-2 rounded-xl bg-[#F5F6F8] text-sm text-neutral-900 placeholder:text-neutral-300 border border-black/[0.04] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 disabled:opacity-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">报警级别</label>
          <select
            value={bark.level}
            onChange={(e) => onBarkChange({ level: e.target.value as BarkLevel })}
            disabled={!bark.enabled}
            className="w-full px-3 py-2 rounded-xl bg-[#F5F6F8] text-sm text-neutral-900 border border-black/[0.04] focus:outline-none disabled:opacity-40"
          >
            {BARK_LEVELS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-neutral-900">持续响铃 30s</span>
          <Toggle
            checked={bark.persistentRing}
            onChange={(v) => onBarkChange({ persistentRing: v })}
            label=""
          />
        </div>
        <button
          onClick={() => void onTestPush()}
          disabled={!bark.enabled || !bark.key}
          className="w-full py-2 rounded-xl bg-[#F2F3F5] text-neutral-600 text-sm font-medium hover:bg-neutral-200 disabled:opacity-40 transition-colors"
        >
          发送测试推送
        </button>
      </div>

      <div className="info-card space-y-1">
        <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mb-2">
          <span className="text-base">🖥</span> 电脑端报警
        </p>
        {([
          ['systemBanner', '横幅通知'],
          ['alarmSound', '警报声'],
          ['ttsVoice', '语音播报'],
          ['popupAlert', '弹窗强提醒'],
        ] as const).map(([key, label]) => (
          <div key={key} className={rowClass}>
            <span className="text-sm text-neutral-900">{label}</span>
            <Toggle checked={desktop[key]} onChange={(v) => onDesktopChange({ [key]: v })} label="" />
          </div>
        ))}
        <button
          onClick={() => {
            if ('Notification' in window && Notification.permission !== 'granted') {
              void Notification.requestPermission()
            } else {
              new Notification('Stock Monitor', { body: '电脑端提醒测试' })
            }
          }}
          className="w-full py-2 mt-2 rounded-xl bg-[#F2F3F5] text-neutral-600 text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          测试电脑提醒
        </button>
      </div>

      <button
        onClick={() => showToast('设置已保存', 'success')}
        className="w-full py-3.5 rounded-2xl bg-[#007AFF] text-white text-[15px] font-semibold hover:bg-[#0066DD] transition-colors shadow-[0_8px_20px_rgba(0,122,255,0.32)]"
      >
        保存设置
      </button>

      {onShare && (
        <div className="flex justify-center">
          <ShareViewButton onGenerate={onShare} />
        </div>
      )}
    </div>
  )
}
