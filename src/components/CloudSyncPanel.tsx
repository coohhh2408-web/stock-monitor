import { useState } from 'react'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Modal'
import { isCloudSyncAvailable } from '@/services/cloudSyncService'
import type { CloudSyncState } from '@/types/cloudSync'

interface CloudSyncPanelProps {
  cloudSync: CloudSyncState
  onChange: (partial: Partial<CloudSyncState>) => void
  onGenerateRoom: () => string
  onSyncNow: () => Promise<void>
}

export function CloudSyncPanel({
  cloudSync,
  onChange,
  onGenerateRoom,
  onSyncNow,
}: CloudSyncPanelProps) {
  const [copied, setCopied] = useState(false)
  const available = isCloudSyncAvailable()

  const handleCopyRoom = async () => {
    if (!cloudSync.roomId) return
    await navigator.clipboard.writeText(cloudSync.roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnable = (enabled: boolean) => {
    if (enabled && !cloudSync.roomId) {
      onChange({ enabled: true, roomId: onGenerateRoom(), error: null })
      return
    }
    onChange({ enabled, error: null })
  }

  const statusLabel = {
    idle: '已连接',
    syncing: '同步中…',
    error: '同步失败',
    offline: '未配置',
  }[cloudSync.status]

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-apple-gray-800">云端多端同步</h3>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full ${
            cloudSync.status === 'error'
              ? 'bg-red-100 text-red-600'
              : cloudSync.status === 'syncing'
                ? 'bg-blue-100 text-blue-600'
                : available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {!available && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-3 leading-relaxed">
          需在项目根目录配置 <code className="text-[10px]">.env</code> 中的 Supabase 密钥后重新构建。
          详见 README「云端同步」章节。
        </p>
      )}

      <Toggle
        checked={cloudSync.enabled}
        onChange={handleEnable}
        label="启用云端同步"
      />

      {cloudSync.enabled && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs text-apple-gray-500">同步码（在每台设备输入相同代码）</span>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={cloudSync.roomId ?? ''}
                onChange={(e) => onChange({ roomId: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) })}
                placeholder="例如 ABC12XYZ"
                className="flex-1 px-3 py-2 rounded-xl bg-white/80 border border-black/[0.06] text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25"
              />
              <button
                type="button"
                onClick={() => onChange({ roomId: onGenerateRoom() })}
                className="shrink-0 px-3 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-medium hover:bg-neutral-200 transition-colors"
              >
                生成
              </button>
              <button
                type="button"
                onClick={handleCopyRoom}
                disabled={!cloudSync.roomId}
                className="shrink-0 px-3 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-medium hover:bg-neutral-200 disabled:opacity-40 transition-colors"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-apple-gray-500">同步 PIN（可选，建议设置）</span>
            <input
              type="password"
              inputMode="numeric"
              value={cloudSync.pin}
              onChange={(e) => onChange({ pin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
              placeholder="4–8 位数字"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/80 border border-black/[0.06] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]/25"
            />
          </label>

          <p className="text-[11px] text-apple-gray-400 leading-relaxed">
            同步内容：自选列表、持仓、做T 记录、提醒规则、通知设置。行情价格仍由本机实时刷新。
            数据经 AES 加密后存入 Supabase，约 30 秒自动同步。
          </p>

          {cloudSync.lastSyncedAt && (
            <p className="text-xs text-apple-gray-400">
              上次同步：{new Date(cloudSync.lastSyncedAt).toLocaleString('zh-CN')}
            </p>
          )}

          {cloudSync.error && (
            <p className="text-xs text-red-600">{cloudSync.error}</p>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => void onSyncNow()}
            disabled={!available || !cloudSync.roomId || cloudSync.status === 'syncing'}
          >
            {cloudSync.status === 'syncing' ? '同步中…' : '立即同步'}
          </Button>
        </div>
      )}
    </section>
  )
}
