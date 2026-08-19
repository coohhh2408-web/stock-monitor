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
        <div className="flex items-center justify-end mb-4">
          <ShareViewButton onGenerate={createShareLink} />
        </div>
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
