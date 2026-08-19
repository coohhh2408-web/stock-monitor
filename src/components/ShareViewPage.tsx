import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { cn, formatPrice, formatCurrency, getChangeColor } from '@/lib/utils'
import { resolveShareSnapshot, type ShareRoute, type ShareSnapshot } from '@/services/shareService'

interface ShareViewPageProps {
  route: ShareRoute
}

export function ShareViewPage({ route }: ShareViewPageProps) {
  const [snapshot, setSnapshot] = useState<ShareSnapshot | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void resolveShareSnapshot(route).then((result) => {
      if (!cancelled) setSnapshot(result)
    })
    return () => {
      cancelled = true
    }
  }, [route])

  if (snapshot === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">正在加载分享内容…</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-apple-gray-600">分享链接无效或已过期</p>
          <p className="text-sm text-apple-gray-400 mt-1">
            {route.type === 'local'
              ? '本机分享链接无法在其他设备打开，请重新生成跨设备链接'
              : '链接数据可能已损坏'}
          </p>
          <a href="#" onClick={() => { window.location.hash = '' }} className="text-sm text-apple-blue mt-3 inline-block">
            返回主页
          </a>
        </div>
      </div>
    )
  }

  const isExpired = new Date(snapshot.expiresAt) < new Date()

  return (
    <div className="min-h-screen">
      <header className="backdrop-blur-md bg-white/60 border-b border-white/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-apple-gray-900">Stock Monitor</h1>
            <p className="text-xs text-apple-gray-500">
              只读分享视图 · {snapshot.createdAt.slice(0, 10)}
              {route.type === 'encoded' && ' · 跨设备链接'}
            </p>
          </div>
          <Badge variant={isExpired ? 'bearish' : 'market'}>
            {isExpired ? '已过期' : '只读'}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-base font-semibold text-apple-gray-800 mb-4">行情快照</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {snapshot.quotes.map((q) => (
              <Card key={q.id} padding="sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{q.name}</p>
                    <p className="text-xs text-apple-gray-500 tabular">{q.code}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold tabular', getChangeColor(q.change))}>
                      {formatPrice(q.price)}
                    </p>
                    <p className={cn('text-xs tabular', getChangeColor(q.change))}>
                      {q.change >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-apple-gray-800 mb-4">持仓快照</h2>
          <div className="space-y-3">
            {snapshot.positions.length === 0 ? (
              <p className="text-sm text-apple-gray-400">暂无持仓</p>
            ) : (
              snapshot.positions.map((p) => (
                <Card key={p.id} padding="sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className={cn('text-sm tabular', getChangeColor(p.totalPnL))}>
                      {formatCurrency(p.totalPnL)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-apple-gray-800 mb-4">活跃提醒</h2>
          <div className="flex flex-wrap gap-2">
            {snapshot.alerts.length === 0 ? (
              <p className="text-sm text-apple-gray-400">暂无活跃提醒</p>
            ) : (
              snapshot.alerts.map((a) => (
                <Badge key={a.id} variant={a.direction === 'above' ? 'bullish' : 'bearish'}>
                  {a.stockName} {a.direction === 'above' ? '≥' : '≤'} {a.targetPrice}
                </Badge>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
