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
    description: 'Sparkline 预览 + AI 价值面诊断 + F10/快讯双 Tab',
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
