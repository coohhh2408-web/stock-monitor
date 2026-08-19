import { useEffect, useState } from 'react'
import { searchLiveStocks } from '@/services/quoteApi'
import type { StockCatalogEntry } from '@/types/market'

export function useStockSearch(query: string, existingCodes: string[]) {
  const [hits, setHits] = useState<StockCatalogEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setHits([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      void searchLiveStocks(q, existingCodes).then((results) => {
        if (!cancelled) {
          setHits(results)
          setLoading(false)
        }
      }).catch(() => {
        if (!cancelled) {
          setHits([])
          setLoading(false)
        }
      })
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, existingCodes.join('|')])

  return { hits, loading }
}
