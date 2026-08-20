import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initNativeApp } from '@/lib/nativeInit'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { AppProvider } from '@/store/AppStore'
import { IncomingCallHost } from '@/components/AlertManager/IncomingCallAlert'
import './index.css'
import App from './App'

initNativeApp()

function AppRoot() {
  const { showToast } = useToast()
  return (
    <AppProvider showToast={showToast}>
      <App />
      <IncomingCallHost />
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
