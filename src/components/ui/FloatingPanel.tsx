import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FloatingPanelProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  layer?: 'base' | 'nested'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
}

export function FloatingPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  showClose = true,
  layer = 'base',
}: FloatingPanelProps) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setClosing(false)
      document.body.style.overflow = 'hidden'
    } else if (visible) {
      setClosing(true)
      const t = setTimeout(() => {
        setVisible(false)
        setClosing(false)
        document.body.style.overflow = ''
      }, 220)
      return () => clearTimeout(t)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, visible])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className={cn('fixed inset-0 flex items-center justify-center p-4 sm:p-6', layer === 'nested' ? 'z-[60]' : 'z-50')}>
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 floating-backdrop',
          closing ? 'animate-fade-in opacity-0 transition-opacity duration-200' : 'animate-fade-in',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full floating-panel flex flex-col max-h-[min(88vh,720px)]',
          sizeMap[size],
          closing ? 'animate-panel-out' : 'animate-panel-in',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="toolbar shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-[15px] font-semibold text-apple-gray-900 leading-tight truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-[12px] text-apple-gray-500 tabular mt-0.5">{subtitle}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                aria-label="关闭"
                className="shrink-0 ml-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/[0.06] hover:bg-black/[0.1] active:scale-95 transition-all duration-150"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-apple-gray-600" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
