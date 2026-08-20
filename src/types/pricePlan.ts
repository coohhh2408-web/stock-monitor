/** 自选上的止盈 / 止损计划。价格由用户自己填，不是系统荐股或券商条件单。 */
export interface PricePlan {
  code: string
  takeProfit?: number
  stopLoss?: number
  /** 从阶段高点回撤百分之几触发跟踪止损，例如 8 表示 −8%。 */
  trailPercent?: number
  /** 开启回撤跟踪后记录的阶段高点。 */
  peakPrice?: number
  updatedAt: string
}

export type PlanAlertKind = 'tp' | 'sl'

export interface PricePlanDraft {
  takeProfit?: number | string | null
  stopLoss?: number | string | null
  trailPercent?: number | string | null
}
