export const MIN_BARS = 12
export const MAX_BARS = 240

export interface ChartView {
  end: number
  size: number
}

export function clampView(end: number, size: number, total: number): ChartView {
  if (total <= 0) return { end: 0, size: 0 }
  const nextSize = Math.max(MIN_BARS, Math.min(size, total, MAX_BARS))
  const nextEnd = Math.max(nextSize, Math.min(end, total))
  return { end: nextEnd, size: nextSize }
}

export function defaultView(period: string, total: number): ChartView {
  if (total <= 0) return { end: 0, size: 0 }
  const size =
    period === 'intraday'
      ? Math.min(total, 240)
      : period === '5d'
        ? Math.min(total, 180)
        : period === 'month'
          ? Math.min(total, 48)
          : Math.min(total, 80)
  return clampView(total, size, total)
}

/** 鼠标向右拖为正：露出更早的 K 线，end 左移。 */
export function panView(view: ChartView, total: number, deltaBars: number): ChartView {
  return clampView(view.end - deltaBars, view.size, total)
}

export function zoomView(view: ChartView, total: number, factor: number, anchor: number): ChartView {
  const nextSize = Math.round(view.size * factor)
  const left = view.end - view.size
  const frac = view.size <= 1 ? 1 : (anchor - left) / view.size
  const sized = clampView(view.end, nextSize, total)
  const newLeft = Math.round(anchor - frac * sized.size)
  return clampView(newLeft + sized.size, sized.size, total)
}
