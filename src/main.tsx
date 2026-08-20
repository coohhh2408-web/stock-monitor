import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { initNativeApp } from '@/lib/nativeInit'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { AppProvider } from '@/store/AppStore'
import { IncomingCallHost } from '@/components/AlertManager/IncomingCallAlert'
import './index.css'
import App from './App'

initNativeApp()

function isMobilePreview(): boolean {
  return new URLSearchParams(window.location.search).get('mobile') === '1'
}

if (isMobilePreview()) {
  document.documentElement.classList.add('mobile-preview')
}

function MobilePreviewFrame({ children }: { children: ReactNode }) {
  if (!isMobilePreview()) return children
  return (
    <div className="mobile-preview-stage">
      <div className="mobile-preview-phone">{children}</div>
    </div>
  )
}

function AppRoot() {
  const { showToast } = useToast()
  return (
    <AppProvider showToast={showToast}>
      <MobilePreviewFrame>
        <App />
        <IncomingCallHost />
      </MobilePreviewFrame>
    </AppProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppRoot />
    </ToastProvider>
  </StrictMode>,
)
