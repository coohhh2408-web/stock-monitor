import { useEffect, useState } from 'react'
import { isNativeIOS } from '@/lib/platform'

function forceMobileQuery(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('mobile') === '1'
}

export function useIsMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && (isNativeIOS() || forceMobileQuery() || window.innerWidth < 768),
  )

  useEffect(() => {
    const update = () => setMobile(isNativeIOS() || forceMobileQuery() || window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return mobile
}
