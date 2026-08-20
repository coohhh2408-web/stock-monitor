import { useEffect, useState } from 'react'
import type { IncomingCallPayload } from '@/types/alert'
import { previewIncomingCall } from '@/services/notificationService'

const INCOMING_CALL_EVENT = 'stock-monitor:incoming-call'

function hashName(): string {
  return window.location.hash.replace(/^#\/?/, '')
}

export function IncomingCallHost() {
  const [queue, setQueue] = useState<IncomingCallPayload[]>([])

  useEffect(() => {
    const onCall = (event: Event) => {
      const detail = (event as CustomEvent<IncomingCallPayload>).detail
      if (!detail?.id) return
      setQueue((prev) => (prev.some((item) => item.id === detail.id) ? prev : [...prev, detail]))
    }
    window.addEventListener(INCOMING_CALL_EVENT, onCall)
    return () => window.removeEventListener(INCOMING_CALL_EVENT, onCall)
  }, [])

  useEffect(() => {
    const maybePush = () => {
      const h = hashName()
      if (h === 'push' || h === 'demo-alert') previewIncomingCall()
    }
    const id = window.setTimeout(maybePush, 500)
    window.addEventListener('hashchange', maybePush)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('hashchange', maybePush)
    }
  }, [])

  const current = queue[0]
  if (!current) return null

  return (
    <IncomingCallAlert
      payload={current}
      onDismiss={() => setQueue((prev) => prev.filter((item) => item.id !== current.id))}
    />
  )
}

function IncomingCallAlert({
  payload,
  onDismiss,
}: {
  payload: IncomingCallPayload
  onDismiss: () => void
}) {
  const [phase, setPhase] = useState<'ringing' | 'answered'>('ringing')
  const initial = payload.coverName.slice(0, 1)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  useEffect(() => {
    if (phase !== 'answered') return
    const id = window.setTimeout(onDismiss, 3200)
    return () => window.clearTimeout(id)
  }, [phase, onDismiss])

  return (
    <div
      className="incoming-call-screen"
      role="dialog"
      aria-modal="true"
      aria-label="来电"
    >
      <div className="incoming-call-glow" />
      <div className="incoming-call-body">
        <div className="incoming-call-avatar-wrap">
          <span className="incoming-call-ring incoming-call-ring-a" />
          <span className="incoming-call-ring incoming-call-ring-b" />
          <span className="incoming-call-ring incoming-call-ring-c" />
          <div className="incoming-call-avatar">{initial}</div>
        </div>
        <p className="incoming-call-name">{payload.coverName}</p>
        <p className="incoming-call-line">{phase === 'ringing' ? '来电' : '已接听'}</p>
        <p className="incoming-call-sub">{payload.coverLine}</p>

        {phase === 'answered' && (
          <div className="incoming-call-note">
            <p className="incoming-call-note-kicker">提醒</p>
            <p className="incoming-call-note-title">{payload.title}</p>
            <p className="incoming-call-note-body">{payload.body}</p>
          </div>
        )}
      </div>

      {phase === 'ringing' ? (
        <div className="incoming-call-actions">
          <button type="button" className="incoming-call-btn" onClick={onDismiss}>
            <span className="incoming-call-circle decline">
              <PhoneIcon rotate={135} />
            </span>
            <span>拒绝</span>
          </button>
          <button type="button" className="incoming-call-btn" onClick={() => setPhase('answered')}>
            <span className="incoming-call-circle accept">
              <PhoneIcon />
            </span>
            <span>接听</span>
          </button>
        </div>
      ) : (
        <div className="incoming-call-actions incoming-call-actions-single">
          <button type="button" className="incoming-call-btn" onClick={onDismiss}>
            <span className="incoming-call-circle decline">
              <PhoneIcon rotate={135} />
            </span>
            <span>挂断</span>
          </button>
        </div>
      )}
    </div>
  )
}

function PhoneIcon({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden style={{ transform: `rotate(${rotate}deg)` }}>
      <path
        fill="white"
        d="M9.1 5.8c.8-.3 1.7.1 2.2.9.5.8.9 1.8.7 2.7l-1.1 1.6c2.1 2.8 4.1 4.8 6.9 6.9l1.6-1.1c.9-.2 1.9.2 2.7.7.8.5 1.2 1.4.9 2.2-.5 1.6-2.6 3.6-4.4 3.6C11.6 24.3 3.7 16.4 3.7 9.4c0-1.8 2-3.9 3.6-4.4z"
      />
    </svg>
  )
}
