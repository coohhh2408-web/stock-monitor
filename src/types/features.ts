export type AppTab = 'market' | 'position' | 'alert'

export interface FeatureStubMeta {
  id: string
  label: string
  description: string
  status: 'stub' | 'loading' | 'ready'
}

export const FEATURE_STUBS = {
  stockDetailDrawer: {
    id: 'stock-detail-drawer',
    label: '个股详情与 AI 诊断',
    description: '真实 K 线 + 盘口 + 可核对的价值清单（习惯买点计算器）',
    status: 'ready',
  },
  marketFilter: {
    id: 'market-filter',
    label: '行情筛选与自选分组',
    description: '板块 Filter 胶囊 + 搜索筛选',
    status: 'ready',
  },
  tTradeModal: {
    id: 't-trade-modal',
    label: '做T 记录与试算',
    description: '录入做T + 自动试算新成本价与释放利润',
    status: 'ready',
  },
  tTradeTimeline: {
    id: 't-trade-timeline',
    label: '做T 流水时间轴',
    description: '历史做T 记录 Timeline UI',
    status: 'ready',
  },
  shareView: {
    id: 'share-view',
    label: '只读分享链接',
    description: '一键生成免密只读看板链接',
    status: 'ready',
  },
  cloudSync: {
    id: 'cloud-sync',
    label: '云端多端同步',
    description: 'Supabase 加密同步自选/持仓/提醒',
    status: 'ready',
  },
} as const satisfies Record<string, FeatureStubMeta>

/** 每个收费功能上线前过这四关：易用、可核对、好看、和雪球/同花顺不一样。 */
export const PRODUCT_GUARDRAILS = {
  usability: '三步内能完成，数字一眼能懂，空态也说得清下一步。',
  credibility: '来源、算法、边界写在界面上。能复核才收费，荐股和冒充大师不收费。',
  craft: '信息层级清楚，手机底栏不挡字，不靠炫技换信任。',
  paidDiff: '卖纪律和工具：做T、到价提醒、可复核的框架；不拼资讯量和社区嗓门。',
} as const
