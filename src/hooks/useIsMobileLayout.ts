import { useEffect, useState } from 'react'
import { isNativeIOS } from '@/lib/platform'

export function useIsMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && (isNativeIOS() || window.innerWidth < 768),
  )

  useEffect(() => {
    const update = () => setMobile(isNativeIOS() || window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return mobile
}
