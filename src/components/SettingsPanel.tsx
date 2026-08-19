import { Modal, Button } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'
import { CloudSyncPanel } from '@/components/CloudSyncPanel'
import type { AppSettings } from '@/types/settings'
import type { CloudSyncState } from '@/types/cloudSync'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onReset: () => void
  cloudSync: CloudSyncState
  onCloudSyncChange: (partial: Partial<CloudSyncState>) => void
  onGenerateSyncRoom: () => string
  onSyncNow: () => Promise<void>
}

export function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onReset,
  cloudSync,
  onCloudSyncChange,
  onGenerateSyncRoom,
  onSyncNow,
}: SettingsPanelProps) {
  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      onReset()
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚙️ 设置"
      size="md"
      footer={<Button variant="secondary" onClick={onClose}>关闭</Button>}
    >
      <div className="space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-apple-gray-800 mb-3">行情刷新</h3>
          <Toggle
            checked={settings.liveQuotesEnabled}
            onChange={(v) => onSettingsChange({ liveQuotesEnabled: v })}
            label="使用真实行情（推荐）"
          />
          <p className="text-[11px] text-apple-gray-400 mt-1.5 mb-3 leading-relaxed">
            打开即可用，无需注册。行情来自腾讯财经（浏览器直连），东方财富作备用。可能有数秒延迟，仅供参考，不构成投资建议。
          </p>
          <Toggle
            checked={settings.priceTickerEnabled}
            onChange={(v) => onSettingsChange({ priceTickerEnabled: v })}
            label="自动刷新行情"
          />
          {settings.priceTickerEnabled && (
            <label className="block mt-3">
              <span className="text-xs text-apple-gray-500">交易时段刷新间隔（秒）</span>
              <input
                type="range"
                min={3}
                max={15}
                value={Math.max(3, settings.tickerIntervalMs / 1000)}
                onChange={(e) =>
                  onSettingsChange({ tickerIntervalMs: parseInt(e.target.value) * 1000 })
                }
                className="w-full mt-1 accent-apple-blue"
              />
              <span className="text-xs text-apple-gray-400 tabular">
                {Math.max(3, settings.tickerIntervalMs / 1000)}s · 收盘后自动降频
              </span>
            </label>
          )}
        </section>

        <section className="pt-4 border-t border-white/30">
          <CloudSyncPanel
            cloudSync={cloudSync}
            onChange={onCloudSyncChange}
            onGenerateRoom={onGenerateSyncRoom}
            onSyncNow={onSyncNow}
          />
        </section>

        <section className="pt-4 border-t border-white/30">
          <h3 className="text-sm font-semibold text-apple-gray-800 mb-2">数据管理</h3>
          {settings.lastSavedAt && (
            <p className="text-xs text-apple-gray-400 mb-3">
              上次保存：{new Date(settings.lastSavedAt).toLocaleString('zh-CN')}
            </p>
          )}
          <p className="text-xs text-apple-gray-500 mb-3">
            所有数据自动保存至浏览器 localStorage
          </p>
          <Button variant="danger" size="sm" onClick={handleReset}>
            重置全部数据
          </Button>
        </section>
      </div>
    </Modal>
  )
}
