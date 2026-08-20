const COVER_NAMES = ['吴女士', '李先生', '王工', '张总', '陈经理', '刘助理', '客户'] as const

function hashCode(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0
  }
  return h
}

export function coverIdentity(code: string): { name: string; line: string } {
  const h = hashCode(code || 'stock')
  const prefix = 130 + (h % 9)
  const mid = String(1000 + ((h >> 4) % 9000)).slice(1)
  const tail = String(10000 + ((h >> 8) % 9000)).slice(1, 5)
  return {
    name: COVER_NAMES[h % COVER_NAMES.length],
    line: `手机  ${prefix}****${tail.slice(0, 4) || mid}`,
  }
}
