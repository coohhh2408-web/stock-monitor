import { useState, useEffect, type ReactNode } from 'react'
import { SettingsPanel } from '@/components/SettingsPanel'
import { ShareViewPage } from '@/components/ShareViewPage'
import { parseShareRoute, type ShareRoute } from '@/services/shareService'
import { TabBar } from '@/components/layout/TabBar'
import { DesktopTabBar } from '@/components/layout/DesktopTabBar'
import { MarketDashboard } from '@/components/MarketDashboard/MarketDashboard'
import { PositionPnL } from '@/components/PositionPnL/PositionPnL'
import { AlertManager } from '@/components/AlertManager/AlertManager'
import { useAppStore } from '@/store/AppStore'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'
import { sessionLabel } from '@/lib/marketHours'
import type { AppTab } from '@/types/features'

function useStatusClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  )
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString('zh-CN', { hour12: false })),
      1000,
    )
    return () => clearInterval(id)
  }, [])
  return time
}

function SquareIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-[10px] bg-white hover:bg-white border border-black/[0.04] flex items-center justify-center text-neutral-800 hover:text-neutral-900 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      {children}
    </button>
  )
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === 'undefined') return 'market'
    const h = window.location.hash.replace(/^#\/?/, '')
    return h === 'alert' || h === 'position' || h === 'market' ? h : 'market'
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, setSettings, resetAllData, refreshQuotes, quotes, quoteFeed, lastRefreshedAt, cloudSync, setCloudSyncConfig, generateSyncRoom, syncNow } = useAppStore()
  const isMobile = useIsMobileLayout()
  const statusTime = useStatusClock()

  const selectTab = (tab: AppTab) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', `#${tab}`)
  }

  const tabTitles: Record<AppTab, string> = {
    market: '行情',
    position: '持仓',
    alert: '提醒',
  }

  const statusText = quoteFeed.status === 'error'
    ? '行情暂不可用 · 显示上次价格'
    : quoteFeed.status === 'mock'
      ? `服务正常 · 模拟行情 · ${statusTime}`
      : settings.liveQuotesEnabled
        ? `服务正常 · ${sessionLabel(quotes)} · ${lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString('zh-CN', { hour12: false }) : statusTime}`
        : `服务正常 · 已暂停 · ${statusTime}`

  return (
    <div className={`min-h-screen flex flex-col ${isMobile ? 'bg-[#F2F2F7]' : 'desktop-mesh-bg'}`}>
      {isMobile ? (
        <header className="ios-header sticky top-0 z-30 bg-[#F2F2F7]/92 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto px-4 h-11 flex items-center justify-between">
            <h1 className="text-[17px] font-semibold text-neutral-900">{tabTitles[activeTab]}</h1>
            <div className="flex items-center -mr-1">
              {activeTab === 'market' && (
                <button
                  onClick={() => void refreshQuotes()}
                  aria-label="刷新行情"
                  className="w-11 h-11 flex items-center justify-center text-[#007AFF]"
                >
                  <RefreshIcon />
                </button>
              )}
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label="设置"
                className="w-11 h-11 flex items-center justify-center text-[#007AFF]"
              >
                <SettingsIcon />
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="max-w-[1180px] mx-auto w-full px-6 pt-7 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 shadow-[0_8px_18px_rgba(0,122,255,0.32)]"
                style={{ background: 'linear-gradient(135deg, #007AFF 0%, #FF375F 100%)' }}
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                  <path d="M3 13l4-4 3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-neutral-900 leading-tight tracking-tight">股价到价强提醒</h1>
                <p className="text-[13px] text-neutral-500 mt-0.5">{statusText}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SquareIconButton label="刷新行情" onClick={() => void refreshQuotes()}>
                <RefreshIcon />
              </SquareIconButton>
              <SquareIconButton label="设置" onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </SquareIconButton>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 mx-auto w-full ios-main-content ${isMobile ? 'max-w-2xl px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+88px)]' : 'max-w-[1180px] px-6 pb-10'}`}>
        {isMobile ? (
          <>
            {activeTab === 'market' && <MarketDashboard isMobile />}
            {activeTab === 'position' && <PositionPnL isMobile />}
            {activeTab === 'alert' && <AlertManager isMobile />}
          </>
        ) : (
          <div className="workspace-glass px-7 py-6">
            <DesktopTabBar
              value={activeTab}
              onChange={selectTab}
            />
            {activeTab === 'market' && <MarketDashboard />}
            {activeTab === 'position' && <PositionPnL />}
            {activeTab === 'alert' && <AlertManager />}
          </div>
        )}
      </main>

      {isMobile && <TabBar active={activeTab} onChange={selectTab} />}

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onReset={resetAllData}
        cloudSync={cloudSync}
        onCloudSyncChange={setCloudSyncConfig}
        onGenerateSyncRoom={generateSyncRoom}
        onSyncNow={syncNow}
      />
    </div>
  )
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <path d="M11 7A4 4 0 112.5 5.5M2.5 5.5V2M2.5 5.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2.2v1.4M8 12.4v1.4M2.2 8h1.4M12.4 8h1.4M4 4l1 1M11 11l1 1M4 12l1-1M11 5l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export default function App() {
  const [shareRoute, setShareRoute] = useState<ShareRoute | null>(null)

  useEffect(() => {
    const parseHash = () => {
      setShareRoute(parseShareRoute(window.location.hash))
    }
    parseHash()
    window.addEventListener('hashchange', parseHash)
    return () => window.removeEventListener('hashchange', parseHash)
  }, [])

  if (shareRoute) return <ShareViewPage route={shareRoute} />

  return <AppShell />
}
