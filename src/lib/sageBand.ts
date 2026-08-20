export type PriceSeat = 'cheap' | 'in-band' | 'rich'

/** 现价相对习惯带：下沿=加仓市盈率对应价，上沿=习惯买点。 */
export function priceSeat(now: number, buyFrom: number, buyTo: number): PriceSeat {
  const lo = Math.min(buyFrom, buyTo)
  const hi = Math.max(buyFrom, buyTo)
  if (now > hi * 1.02) return 'rich'
  if (now < lo * 0.97) return 'cheap'
  return 'in-band'
}

export function bandHint(seat: PriceSeat): string {
  if (seat === 'rich') return '现价高出沿，要等回落'
  if (seat === 'cheap') return '现价低于下沿'
  return '现价已在区内'
}
