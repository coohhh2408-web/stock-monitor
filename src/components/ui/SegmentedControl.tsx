import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[]
  value: T
  onChange: (value: T) => void
  className?: string
  fullWidth?: boolean
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const idx = options.findIndex((o) => o.value === value)
    const btn = container.querySelectorAll('button')[idx]
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [value, options])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex p-[3px] rounded-[9px] bg-neutral-200/80',
        fullWidth && 'w-full',
        className,
      )}
    >
      <div
        className="absolute top-[3px] bottom-[3px] rounded-[6px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 flex-1 px-3 py-1.5 text-[13px] font-medium transition-colors rounded-[6px] inline-flex items-center justify-center gap-1.5',
            !fullWidth && 'flex-none',
            value === opt.value ? 'text-neutral-900' : 'text-neutral-500',
          )}
        >
          {opt.icon && <span className="shrink-0 opacity-80">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
