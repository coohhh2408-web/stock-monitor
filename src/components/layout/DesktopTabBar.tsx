import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { AppTab } from '@/types/features'

const TABS: {
  value: AppTab
  label: string
  icon: ReactNode
}[] = [
  {
    value: 'market',
    label: '实时行情看板',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 12V8" stroke="#34C759" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 12V4" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9.5 12V6.5" stroke="#5AC8FA" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13 12V3" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'screener',
    label: '价值选股',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="4.2" stroke="#007AFF" strokeWidth="1.5" />
        <path d="M10.2 10.2L13.2 13.2" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'position',
    label: '持仓盈亏与做T',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="5" width="10" height="8" rx="1.5" stroke="#C9894A" strokeWidth="1.5" />
        <path d="M6 5V4a2 2 0 014 0v1" stroke="#C9894A" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: 'alert',
    label: '提醒管理',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2.5a3.5 3.5 0 013.5 3.5v2.2l1.2 1.8H3.3L4.5 8.2V6A3.5 3.5 0 018 2.5z" stroke="#E5A100" strokeWidth="1.5" />
        <path d="M6.8 13a1.2 1.2 0 002.4 0" stroke="#E5A100" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function DesktopTabBar({
  value,
  onChange,
}: {
  value: AppTab
  onChange: (tab: AppTab) => void
}) {
  return (
    <div className="flex flex-wrap gap-2.5 mb-5">
      {TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all press-float',
              active
                ? 'bg-white/90 text-neutral-900 shadow-[0_8px_20px_rgba(0,0,0,0.1)] backdrop-blur-xl'
                : 'bg-white/40 text-neutral-500 hover:bg-white/55 backdrop-blur-md',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
