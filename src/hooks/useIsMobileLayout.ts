import { useEffect, useState } from 'react'
import { isNativeIOS } from '@/lib/platform'

export function useIsMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && (isNativeIOS() || window.innerWidth < 1024),
  )

  useEffect(() => {
    const update = () => setMobile(isNativeIOS() || window.innerWidth < 1024)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return mobile
}
