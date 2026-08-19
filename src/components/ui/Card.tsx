import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'stocks' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'stocks', padding = 'md', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === 'stocks' ? 'stocks-card' : 'bg-white/80 backdrop-blur-xl rounded-2xl border border-black/[0.03] shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'
