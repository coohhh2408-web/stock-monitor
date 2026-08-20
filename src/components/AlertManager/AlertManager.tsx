import { AlertRules } from './AlertRules'
import { NotificationPanel } from './NotificationPanel'
import { ShareViewButton } from './ShareViewButton'
import { useAppStore } from '@/store/AppStore'

export function AlertManager({ isMobile = false }: { isMobile?: boolean }) {
  const {
    quotes, alerts, bark, desktop,
    addAlert, updateAlert, deleteAlert, toggleAlert,
    setBark, setDesktop, createShareLink, testBarkPush,
  } = useAppStore()

  return (
    <div>
      {isMobile && (
        <header className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-neutral-900 leading-none">提醒</h1>
            <p className="text-[15px] text-neutral-500 mt-2">到价再通知，不用一直盯盘</p>
          </div>
          <ShareViewButton onGenerate={createShareLink} />
        </header>
      )}

      <div className={isMobile ? 'space-y-5' : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start'}>
        <AlertRules
          quotes={quotes}
          rules={alerts}
          onEdit={updateAlert}
          onDelete={deleteAlert}
          onAdd={addAlert}
          onToggle={toggleAlert}
        />

        <NotificationPanel
          bark={bark}
          desktop={desktop}
          variant={isMobile ? 'inline' : 'sidebar'}
          onBarkChange={setBark}
          onDesktopChange={setDesktop}
          onTestPush={testBarkPush}
          onShare={isMobile ? undefined : createShareLink}
        />
      </div>
    </div>
  )
}
