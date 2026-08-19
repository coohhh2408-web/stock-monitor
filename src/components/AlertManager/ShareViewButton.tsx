import { useState } from 'react'
import type { ShareViewStub } from '@/types/alert'

export function ShareViewButton({ onGenerate }: { onGenerate: () => Promise<ShareViewStub> }) {
  const [share, setShare] = useState<ShareViewStub>({ status: 'idle', shareUrl: null, expiresAt: null, isReadOnly: true })

  const handle = async () => {
    if (share.status === 'ready' || share.status === 'copied') {
      if (share.shareUrl) {
        await navigator.clipboard.writeText(share.shareUrl)
        setShare((s) => ({ ...s, status: 'copied' }))
        setTimeout(() => setShare((s) => ({ ...s, status: 'ready' })), 2000)
      }
      return
    }
    setShare((s) => ({ ...s, status: 'generating' }))
    try {
      setShare(await onGenerate())
    } catch {
      setShare((s) => ({ ...s, status: 'error' }))
    }
  }

  const labels = { idle: '分享', generating: '…', ready: '复制链接', copied: '已复制', error: '重试' }

  return (
    <button
      onClick={handle}
      disabled={share.status === 'generating'}
      className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full font-medium transition-colors"
    >
      {labels[share.status]}
    </button>
  )
}
