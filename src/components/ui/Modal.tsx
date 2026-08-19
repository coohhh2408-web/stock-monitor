import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const isMobile = useIsMobileLayout()

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
    <div
      className={cn('apple-modal-backdrop z-[60]', isMobile && 'mobile-sheet')}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'apple-modal flex flex-col bg-white',
          isMobile ? 'mobile-sheet-panel w-full' : cn('max-h-[min(88vh,720px)]', sizeMap[size]),
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-2.5 pb-1">
            <span className="w-9 h-1 rounded-full bg-neutral-300" />
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-[17px] font-semibold text-neutral-900 truncate pr-3">{title}</h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/[0.06] shrink-0"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neutral-600" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-black/[0.06] flex justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const buttonVariants = {
  primary: 'bg-apple-blue text-white hover:bg-[#0066E0] active:scale-[0.98] shadow-sm',
  secondary: 'bg-black/[0.06] text-apple-gray-800 hover:bg-black/[0.09] active:scale-[0.98]',
  ghost: 'bg-transparent text-apple-blue hover:bg-apple-blue/8 active:scale-[0.98]',
  danger: 'bg-apple-red/10 text-apple-red hover:bg-apple-red/15 active:scale-[0.98]',
}

const buttonSizes = {
  sm: 'px-3.5 py-1.5 text-[13px] rounded-full',
  md: 'px-5 py-2 text-[14px] rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
