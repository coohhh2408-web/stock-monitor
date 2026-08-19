import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton-shimmer', className)} />
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="glass p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  )
}

export function SparklineStub() {
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-apple-gray-500">分时预览</span>
        <span className="text-xs text-apple-gray-400 bg-apple-gray-100/60 px-2 py-0.5 rounded-lg">
          即将上线
        </span>
      </div>
      <div className="h-32 flex items-end gap-0.5 px-2">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 skeleton-shimmer rounded-sm"
            style={{ height: `${30 + Math.sin(i * 0.3) * 20 + Math.random() * 15}%` }}
          />
        ))}
      </div>
    </div>
  )
}
