import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Shelf({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-7', className)}>
      <div className="flex items-baseline justify-between gap-3 mb-3 px-0.5">
        <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">{title}</h2>
        {action}
      </div>
      <div className="shelf">{children}</div>
    </section>
  )
}
