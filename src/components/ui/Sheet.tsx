import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

export function Sheet({ isOpen, onClose, title, subtitle, children }: SheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-lg',
          'glass rounded-none rounded-l-2xl border-r-0',
          'animate-slide-in-right overflow-y-auto',
        )}
      >
        <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 px-6 py-4 border-b border-white/30">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-apple-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-apple-gray-500 mt-0.5 tabular">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-apple-gray-100/80 text-apple-gray-600 hover:bg-apple-gray-200/80 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">{children}</div>
      </div>
    </div>
  )
}
