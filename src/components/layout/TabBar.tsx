import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { lightTap } from '@/lib/nativeInit'
import type { AppTab } from '@/types/features'

const TABS: { value: AppTab; label: string; icon: (active: boolean) => ReactNode }[] = [
  {
    value: 'market',
    label: '行情',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 18V6M8 18V10M12 18V4M16 18V13M20 18V8"
          stroke={active ? '#007AFF' : '#8E8E93'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'screener',
    label: '选股',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="6" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" />
        <path d="M15.5 15.5L20 20" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 11h6M11 8v6" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'position',
    label: '持仓',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" rx="2" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" />
        <path d="M8 10h8M8 14h5" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'alert',
    label: '提醒',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4C8.5 4 6 6.5 6 10v4l-2 2h16l-2-2v-4c0-3.5-2.5-6-6-6z"
          stroke={active ? '#007AFF' : '#8E8E93'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M10 20a2 2 0 004 0" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

interface TabBarProps {
  active: AppTab
  onChange: (tab: AppTab) => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="ios-tab-bar fixed bottom-0 left-0 right-0 z-40 bg-[#F2F2F7] border-t border-black/10">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {TABS.map(({ value, label, icon }) => {
          const isActive = active === value
          return (
            <button
              key={value}
              onClick={() => {
                void lightTap()
                onChange(value)
              }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[49px] transition-colors',
                isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]',
              )}
            >
              {icon(isActive)}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
