import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  MOCK_QUOTES,
  MOCK_POSITIONS,
  MOCK_T_TRADES,
  MOCK_ALERTS,
} from '@/data/mockData'
import { loadFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from '@/lib/storage'
import { tickQuote, syncPositionPrice, computePortfolioSummary, generateAIDiagnosis, generateSparkline, buildPosition } from '@/services/marketService'
import { fetchLiveQuote, fetchLiveQuotes } from '@/services/quoteApi'
import { recommendedPollMs } from '@/lib/marketHours'
import { generateShareLink } from '@/services/shareService'
import {
  buildSyncPayload,
  isCloudSyncAvailable,
  loadCloudSyncConfig,
  pullFromCloud,
  pushToCloud,
  saveCloudSyncConfig,
  generateRoomId,
} from '@/services/cloudSyncService'
import {
  deliverDesktopAlert,
  requestNotificationPermission,
  sendBarkPush,
} from '@/services/notificationService'
import { catalogEntryToQuote } from '@/data/stockCatalog'
import { alertTriggerMessage, isAlertTriggered, normalizeAlertRule } from '@/lib/alertUtils'
import type { QuoteItem, AIDiagnosisStub, SparklineDataPoint, StockCatalogEntry } from '@/types/market'
import type {
  PositionItem,
  TTradeRecord,
  TTradeFormInput,
  TTradeCalculationResult,
  PortfolioSummary,
} from '@/types/position'
import type { AlertRule, BarkSettings, DesktopAlertSettings, ShareViewStub } from '@/types/alert'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/types/settings'
import type { CloudSyncState, SyncPayload } from '@/types/cloudSync'

type ToastFn = (message: string, kind?: 'success' | 'error' | 'info') => void
export type QuoteFeedStatus = 'idle' | 'live' | 'error' | 'mock'

interface QuoteFeed {
  status: QuoteFeedStatus
  source: string
}

interface AppState {
  quotes: QuoteItem[]
  positions: PositionItem[]
  tTrades: TTradeRecord[]
  alerts: AlertRule[]
  bark: BarkSettings
  desktop: DesktopAlertSettings
  settings: AppSettings
  aiCache: Record<string, AIDiagnosisStub>
  sparklineCache: Record<string, SparklineDataPoint[]>
  lastRefreshedAt: string | null
  quoteFeed: QuoteFeed
}

type Action =
  | { type: 'SET_QUOTES'; quotes: QuoteItem[] }
  | { type: 'TICK_PRICES' }
  | { type: 'MERGE_LIVE_QUOTES'; quotes: QuoteItem[] }
  | { type: 'SET_QUOTE_FEED'; status: QuoteFeedStatus; source?: string }
  | { type: 'SET_SPARKLINES'; cache: Record<string, SparklineDataPoint[]> }
  | { type: 'TOGGLE_WATCHLIST'; quoteId: string }
  | { type: 'ADD_QUOTE'; quote: QuoteItem }
  | { type: 'REMOVE_QUOTE'; quoteId: string }
  | { type: 'REORDER_QUOTES'; fromId: string; toId: string }
  | { type: 'REORDER_POSITIONS'; fromId: string; toId: string }
  | { type: 'ADD_T_TRADE'; record: TTradeRecord; position: PositionItem }
  | { type: 'UPSERT_POSITION'; position: PositionItem }
  | { type: 'DELETE_POSITION'; positionId: string }
  | { type: 'SET_ALERTS'; alerts: AlertRule[] }
  | { type: 'ADD_ALERT'; alert: AlertRule }
  | { type: 'UPDATE_ALERT'; alert: AlertRule }
  | { type: 'DELETE_ALERT'; id: string }
  | { type: 'SET_BARK'; bark: Partial<BarkSettings> }
  | { type: 'SET_DESKTOP'; desktop: Partial<DesktopAlertSettings> }
  | { type: 'SET_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'SET_AI_DIAGNOSIS'; code: string; diagnosis: AIDiagnosisStub }
  | { type: 'HYDRATE_SYNC'; payload: SyncPayload }
  | { type: 'RESET_ALL' }

function normalizeAlerts(alerts: AlertRule[]): AlertRule[] {
  return alerts.map(normalizeAlertRule)
}

function loadInitialState(): AppState {
  const quotes = loadFromStorage(STORAGE_KEYS.quotes, MOCK_QUOTES)
  const positions = syncPositionPrice(
    loadFromStorage(STORAGE_KEYS.positions, MOCK_POSITIONS),
    quotes,
  )

  return {
    quotes,
    positions,
    tTrades: loadFromStorage(STORAGE_KEYS.tTrades, MOCK_T_TRADES),
    alerts: normalizeAlerts(loadFromStorage(STORAGE_KEYS.alerts, MOCK_ALERTS)),
    bark: {
      enabled: false,
      key: '',
      level: 'critical' as const,
      persistentRing: true,
      ...loadFromStorage<Partial<BarkSettings>>(STORAGE_KEYS.bark, {}),
    },
    desktop: loadFromStorage(STORAGE_KEYS.desktop, {
      systemBanner: true,
      alarmSound: true,
      ttsVoice: false,
      popupAlert: true,
    }),
    settings: { ...DEFAULT_APP_SETTINGS, ...loadFromStorage(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS) },
    aiCache: loadFromStorage(STORAGE_KEYS.aiCache, {}),
    sparklineCache: {},
    lastRefreshedAt: null,
    quoteFeed: { status: 'idle', source: 'eastmoney' },
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_QUOTES':
      return { ...state, quotes: action.quotes }

    case 'TICK_PRICES': {
      const quotes = state.quotes.map(tickQuote)
      const positions = syncPositionPrice(state.positions, quotes)
      return { ...state, quotes, positions, lastRefreshedAt: new Date().toISOString() }
    }

    case 'MERGE_LIVE_QUOTES': {
      const quotes = action.quotes
      const positions = syncPositionPrice(state.positions, quotes)
      return {
        ...state,
        quotes,
        positions,
        lastRefreshedAt: new Date().toISOString(),
      }
    }

    case 'SET_QUOTE_FEED':
      return {
        ...state,
        quoteFeed: {
          status: action.status,
          source: action.source ?? state.quoteFeed.source,
        },
      }

    case 'SET_SPARKLINES':
      return { ...state, sparklineCache: { ...state.sparklineCache, ...action.cache } }

    case 'TOGGLE_WATCHLIST': {
      const quotes = state.quotes.map((q) =>
        q.id === action.quoteId ? { ...q, isWatchlisted: !q.isWatchlisted } : q,
      )
      return { ...state, quotes }
    }

    case 'ADD_QUOTE': {
      const idx = state.quotes.findIndex((q) => q.code === action.quote.code)
      if (idx === -1) return { ...state, quotes: [...state.quotes, action.quote] }
      const quotes = [...state.quotes]
      quotes[idx] = { ...quotes[idx], ...action.quote, id: quotes[idx].id }
      return { ...state, quotes, positions: syncPositionPrice(state.positions, quotes) }
    }

    case 'REMOVE_QUOTE': {
      const removed = state.quotes.find((q) => q.id === action.quoteId)
      return {
        ...state,
        quotes: state.quotes.filter((q) => q.id !== action.quoteId),
        alerts: removed
          ? state.alerts.filter((a) => a.stockCode !== removed.code)
          : state.alerts,
      }
    }

    case 'REORDER_QUOTES': {
      const from = state.quotes.findIndex((q) => q.id === action.fromId)
      const to = state.quotes.findIndex((q) => q.id === action.toId)
      if (from < 0 || to < 0 || from === to) return state
      const quotes = [...state.quotes]
      const [item] = quotes.splice(from, 1)
      quotes.splice(to, 0, item)
      return { ...state, quotes }
    }

    case 'REORDER_POSITIONS': {
      const from = state.positions.findIndex((p) => p.id === action.fromId)
      const to = state.positions.findIndex((p) => p.id === action.toId)
      if (from < 0 || to < 0 || from === to) return state
      const positions = [...state.positions]
      const [item] = positions.splice(from, 1)
      positions.splice(to, 0, item)
      return { ...state, positions }
    }

    case 'ADD_T_TRADE':
      return {
        ...state,
        tTrades: [action.record, ...state.tTrades],
        positions: state.positions.map((p) =>
          p.id === action.position.id ? action.position : p,
        ),
      }

    case 'UPSERT_POSITION': {
      const exists = state.positions.some((p) => p.id === action.position.id)
      const positions = exists
        ? state.positions.map((p) => (p.id === action.position.id ? action.position : p))
        : [...state.positions, action.position]
      return { ...state, positions: syncPositionPrice(positions, state.quotes) }
    }

    case 'DELETE_POSITION':
      return {
        ...state,
        positions: state.positions.filter((p) => p.id !== action.positionId),
        tTrades: state.tTrades.filter((t) => t.positionId !== action.positionId),
      }

    case 'SET_ALERTS':
      return { ...state, alerts: action.alerts }

    case 'ADD_ALERT':
      return { ...state, alerts: [...state.alerts, normalizeAlertRule(action.alert)] }

    case 'UPDATE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.alert.id ? normalizeAlertRule(action.alert) : a,
        ),
      }

    case 'DELETE_ALERT':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.id) }

    case 'SET_BARK':
      return { ...state, bark: { ...state.bark, ...action.bark } }

    case 'SET_DESKTOP':
      return { ...state, desktop: { ...state.desktop, ...action.desktop } }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }

    case 'SET_AI_DIAGNOSIS':
      return {
        ...state,
        aiCache: { ...state.aiCache, [action.code]: action.diagnosis },
      }

    case 'HYDRATE_SYNC': {
      const { payload } = action
      const quotes = payload.quotes
      const positions = syncPositionPrice(payload.positions, quotes)
      return {
        ...state,
        quotes,
        positions,
        tTrades: payload.tTrades,
        alerts: normalizeAlerts(payload.alerts),
        bark: payload.bark,
        desktop: payload.desktop,
        settings: { ...DEFAULT_APP_SETTINGS, ...payload.settings },
      }
    }

    case 'RESET_ALL':
      return {
        quotes: MOCK_QUOTES,
        positions: MOCK_POSITIONS,
        tTrades: MOCK_T_TRADES,
        alerts: normalizeAlerts(MOCK_ALERTS),
        bark: { enabled: false, key: '', level: 'critical' as const, persistentRing: true },
        desktop: { systemBanner: true, alarmSound: true, ttsVoice: false, popupAlert: true },
        settings: DEFAULT_APP_SETTINGS,
        aiCache: {},
        sparklineCache: {},
        lastRefreshedAt: null,
        quoteFeed: { status: 'idle', source: 'eastmoney' },
      }

    default:
      return state
  }
}

interface AppContextValue {
  quotes: QuoteItem[]
  positions: PositionItem[]
  tTrades: TTradeRecord[]
  alerts: AlertRule[]
  bark: BarkSettings
  desktop: DesktopAlertSettings
  settings: AppSettings
  summary: PortfolioSummary
  lastRefreshedAt: string | null
  quoteFeed: QuoteFeed
  toggleWatchlist: (quoteId: string) => void
  addStock: (entry: StockCatalogEntry) => Promise<boolean>
  removeStock: (quoteId: string) => void
  reorderQuotes: (fromId: string, toId: string) => void
  reorderPositions: (fromId: string, toId: string) => void
  refreshQuotes: () => Promise<void>
  recordTTrade: (
    positionId: string,
    form: TTradeFormInput,
    result: TTradeCalculationResult,
  ) => void
  upsertPosition: (input: {
    id?: string
    code: string
    shares: number
    originalCost: number
    actualCost?: number
  }) => boolean
  deletePosition: (positionId: string) => void
  addAlert: (alert: Omit<AlertRule, 'id' | 'createdAt'>) => Promise<void>
  updateAlert: (alert: AlertRule) => void
  deleteAlert: (id: string) => void
  toggleAlert: (id: string) => void
  setBark: (partial: Partial<BarkSettings>) => void
  setDesktop: (partial: Partial<DesktopAlertSettings>) => void
  setSettings: (partial: Partial<AppSettings>) => void
  getSparkline: (code: string, basePrice: number) => SparklineDataPoint[]
  getAIDiagnosis: (stock: QuoteItem) => AIDiagnosisStub
  generateAI: (stock: QuoteItem) => Promise<void>
  createShareLink: () => Promise<ShareViewStub>
  resetAllData: () => void
  testBarkPush: () => Promise<void>
  cloudSync: CloudSyncState
  setCloudSyncConfig: (partial: Partial<CloudSyncState>) => void
  generateSyncRoom: () => string
  syncNow: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  children,
  showToast,
}: {
  children: ReactNode
  showToast?: ToastFn
}) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)
  const [cloudSync, setCloudSyncState] = useState<CloudSyncState>(loadCloudSyncConfig)
  const notifiedAlerts = useRef<Set<string>>(new Set())
  const toast = showToast ?? (() => {})
  const quotesRef = useRef(state.quotes)
  quotesRef.current = state.quotes
  const fetchingRef = useRef(false)
  const failCountRef = useRef(0)
  const applyingRemoteRef = useRef(false)
  const pushTimerRef = useRef<number | undefined>(undefined)
  const cloudSyncRef = useRef(cloudSync)
  cloudSyncRef.current = cloudSync

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.quotes, state.quotes)
    saveToStorage(STORAGE_KEYS.positions, state.positions)
    saveToStorage(STORAGE_KEYS.tTrades, state.tTrades)
    saveToStorage(STORAGE_KEYS.alerts, state.alerts)
    saveToStorage(STORAGE_KEYS.bark, state.bark)
    saveToStorage(STORAGE_KEYS.desktop, state.desktop)
    saveToStorage(STORAGE_KEYS.appSettings, {
      ...state.settings,
      lastSavedAt: new Date().toISOString(),
    })
    saveToStorage(STORAGE_KEYS.aiCache, state.aiCache)
  }, [state])

  const pullLiveQuotes = useCallback(async (silent = true) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const next = await fetchLiveQuotes(quotesRef.current)
      dispatch({ type: 'MERGE_LIVE_QUOTES', quotes: next })
      dispatch({ type: 'SET_QUOTE_FEED', status: 'live', source: 'tencent' })
      failCountRef.current = 0
      if (!silent) toast('行情已刷新', 'success')
    } catch {
      failCountRef.current += 1
      dispatch({ type: 'SET_QUOTE_FEED', status: 'error' })
      if (!silent || failCountRef.current === 2) {
        toast('真实行情暂时不可用，显示上次价格', 'error')
      }
    } finally {
      fetchingRef.current = false
    }
  }, [toast])

  useEffect(() => {
    if (!state.settings.priceTickerEnabled) return
    if (state.settings.liveQuotesEnabled) {
      void pullLiveQuotes(true)
      const intervalMs = recommendedPollMs(state.quotes, state.settings.tickerIntervalMs)
      const id = setInterval(() => {
        void pullLiveQuotes(true)
      }, intervalMs)
      return () => clearInterval(id)
    }
    dispatch({ type: 'SET_QUOTE_FEED', status: 'mock', source: 'mock' })
    const id = setInterval(() => {
      dispatch({ type: 'TICK_PRICES' })
    }, state.settings.tickerIntervalMs)
    return () => clearInterval(id)
  }, [
    state.settings.priceTickerEnabled,
    state.settings.liveQuotesEnabled,
    state.settings.tickerIntervalMs,
    state.quotes.length,
    pullLiveQuotes,
  ])

  useEffect(() => {
    const activeAlerts = state.alerts.filter((a) => a.isActive)
    if (activeAlerts.length === 0) return

    for (const alert of activeAlerts) {
      const quote = state.quotes.find((q) => q.code === alert.stockCode)
      if (!quote) continue

      if (!isAlertTriggered(alert, quote)) {
        notifiedAlerts.current.delete(alert.id)
        continue
      }

      if (notifiedAlerts.current.has(alert.id)) continue
      notifiedAlerts.current.add(alert.id)

      const title = `${alert.stockName} 提醒触发`
      const body = alertTriggerMessage(alert, quote)

      deliverDesktopAlert(state.desktop, title, body)

      if (state.bark.enabled && state.bark.key.trim()) {
        void sendBarkPush(state.bark, title, body)
      }
    }
  }, [state.quotes, state.alerts, state.desktop, state.bark])

  const summary = useMemo(() => computePortfolioSummary(state.positions), [state.positions])

  const toggleWatchlist = useCallback((quoteId: string) => {
    dispatch({ type: 'TOGGLE_WATCHLIST', quoteId })
  }, [])

  const addStock = useCallback(
    async (entry: StockCatalogEntry) => {
      const exists = quotesRef.current.some((q) => q.code === entry.code)
      if (exists) {
        toast('该标的已在看板中', 'info')
        return false
      }
      const placeholder = catalogEntryToQuote(entry)
      dispatch({ type: 'ADD_QUOTE', quote: placeholder })
      toast(`已添加 ${entry.name}`, 'success')
      if (state.settings.liveQuotesEnabled) {
        try {
          const live = await fetchLiveQuote(entry)
          dispatch({ type: 'ADD_QUOTE', quote: { ...live, id: placeholder.id, isWatchlisted: true } })
        } catch {
          toast('已加入看板，实时价稍后刷新', 'info')
        }
      }
      return true
    },
    [state.settings.liveQuotesEnabled, toast],
  )

  const removeStock = useCallback(
    (quoteId: string) => {
      const quote = state.quotes.find((q) => q.id === quoteId)
      dispatch({ type: 'REMOVE_QUOTE', quoteId })
      if (quote) toast(`已移出 ${quote.name}`, 'info')
    },
    [state.quotes, toast],
  )

  const reorderQuotes = useCallback((fromId: string, toId: string) => {
    dispatch({ type: 'REORDER_QUOTES', fromId, toId })
  }, [])

  const reorderPositions = useCallback((fromId: string, toId: string) => {
    dispatch({ type: 'REORDER_POSITIONS', fromId, toId })
  }, [])

  const refreshQuotes = useCallback(async () => {
    if (state.settings.liveQuotesEnabled) {
      await pullLiveQuotes(false)
      return
    }
    dispatch({ type: 'TICK_PRICES' })
    toast('行情已刷新', 'success')
  }, [pullLiveQuotes, state.settings.liveQuotesEnabled, toast])

  const recordTTrade = useCallback(
    (positionId: string, form: TTradeFormInput, result: TTradeCalculationResult) => {
      const pos = state.positions.find((p) => p.id === positionId)
      if (!pos) return

      const newShares =
        form.direction === 'buy' ? pos.shares + form.shares : pos.shares - form.shares

      const updated: PositionItem = {
        ...pos,
        actualCost: result.newCostPrice,
        tTradeSaved: Math.max(0, Math.round((pos.originalCost - result.newCostPrice) * 100) / 100),
        shares: Math.max(0, newShares),
        marketValue: Math.round(pos.currentPrice * Math.max(0, newShares)),
        totalPnL: Math.round((pos.currentPrice - result.newCostPrice) * Math.max(0, newShares) * 100) / 100,
      }

      const record: TTradeRecord = {
        id: crypto.randomUUID(),
        positionId,
        direction: form.direction,
        price: form.price,
        shares: form.shares,
        fee: form.fee,
        timestamp: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        newCostPrice: result.newCostPrice,
        releasedProfit: result.releasedProfit,
      }

      dispatch({ type: 'ADD_T_TRADE', record, position: updated })
      toast('做 T 记录已保存', 'success')
    },
    [state.positions, toast],
  )

  const upsertPosition = useCallback(
    (input: { id?: string; code: string; shares: number; originalCost: number; actualCost?: number }) => {
      const quote = state.quotes.find((q) => q.code === input.code)
      const existing = input.id
        ? state.positions.find((p) => p.id === input.id)
        : state.positions.find((p) => p.code === input.code)

      if (!input.id && existing) {
        toast('该股票已有持仓，请直接编辑', 'info')
        return false
      }

      const name = quote?.name ?? existing?.name
      if (!name) {
        toast('请先在行情页添加该股票', 'error')
        return false
      }

      const position = buildPosition({
        id: existing?.id ?? input.id,
        name,
        code: input.code,
        shares: input.shares,
        originalCost: input.originalCost,
        actualCost: input.actualCost,
        currentPrice: quote?.price ?? existing?.currentPrice ?? input.originalCost,
        prevClose: quote ? quote.price - quote.change : existing?.currentPrice,
      })

      dispatch({ type: 'UPSERT_POSITION', position })
      toast(existing ? '持仓已更新' : '已添加持仓', 'success')
      return true
    },
    [state.quotes, state.positions, toast],
  )

  const deletePosition = useCallback(
    (positionId: string) => {
      const pos = state.positions.find((p) => p.id === positionId)
      dispatch({ type: 'DELETE_POSITION', positionId })
      if (pos) toast(`已删除 ${pos.name} 持仓`, 'info')
    },
    [state.positions, toast],
  )

  const addAlert = useCallback(
    async (partial: Omit<AlertRule, 'id' | 'createdAt'>) => {
      const perm = await requestNotificationPermission()
      if (perm === 'denied') {
        toast('通知权限被拒绝，桌面提醒可能无法显示', 'error')
      }

      dispatch({
        type: 'ADD_ALERT',
        alert: {
          ...partial,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString().slice(0, 10),
        },
      })
      toast('提醒规则已添加', 'success')
    },
    [toast],
  )

  const updateAlert = useCallback((alert: AlertRule) => {
    dispatch({ type: 'UPDATE_ALERT', alert })
  }, [])

  const deleteAlert = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_ALERT', id })
      toast('规则已删除', 'info')
    },
    [toast],
  )

  const toggleAlert = useCallback(
    (id: string) => {
      const rule = state.alerts.find((a) => a.id === id)
      if (!rule) return
      const next = !rule.isActive
      dispatch({ type: 'UPDATE_ALERT', alert: { ...rule, isActive: next } })
      toast(next ? '规则已启用' : '规则已暂停', 'info')
    },
    [state.alerts, toast],
  )

  const getSparkline = useCallback(
    (code: string, basePrice: number) => {
      if (state.sparklineCache[code]) return state.sparklineCache[code]
      const seed = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
      return generateSparkline(basePrice, seed)
    },
    [state.sparklineCache],
  )

  const getAIDiagnosis = useCallback(
    (stock: QuoteItem) => state.aiCache[stock.code] ?? { status: 'idle' as const },
    [state.aiCache],
  )

  const generateAI = useCallback(async (stock: QuoteItem) => {
    dispatch({
      type: 'SET_AI_DIAGNOSIS',
      code: stock.code,
      diagnosis: { status: 'loading' },
    })
    try {
      const result = await generateAIDiagnosis(stock)
      dispatch({ type: 'SET_AI_DIAGNOSIS', code: stock.code, diagnosis: result })
    } catch {
      dispatch({
        type: 'SET_AI_DIAGNOSIS',
        code: stock.code,
        diagnosis: { status: 'error' },
      })
    }
  }, [])

  const createShareLink = useCallback(async () => {
    return generateShareLink({
      quotes: state.quotes,
      positions: state.positions,
      alerts: state.alerts.filter((a) => a.isActive),
    })
  }, [state.quotes, state.positions, state.alerts])

  const setCloudSyncConfig = useCallback((partial: Partial<CloudSyncState>) => {
    setCloudSyncState((prev) => {
      const next = {
        ...prev,
        ...partial,
        status: partial.status ?? (isCloudSyncAvailable() ? 'idle' : 'offline'),
      }
      saveCloudSyncConfig(next)
      return next
    })
  }, [])

  const buildLocalSyncPayload = useCallback(() => {
    return buildSyncPayload({
      quotes: state.quotes,
      positions: state.positions,
      tTrades: state.tTrades,
      alerts: state.alerts,
      bark: state.bark,
      desktop: state.desktop,
      settings: state.settings,
    })
  }, [state.quotes, state.positions, state.tTrades, state.alerts, state.bark, state.desktop, state.settings])

  const pushCloudSync = useCallback(async () => {
    const cfg = cloudSyncRef.current
    if (!cfg.enabled || !cfg.roomId || !isCloudSyncAvailable()) return

    setCloudSyncState((s) => ({ ...s, status: 'syncing', error: null }))
    try {
      const payload = buildLocalSyncPayload()
      const updatedAt = await pushToCloud(cfg.roomId, cfg.pin, payload)
      setCloudSyncState((s) => {
        const next = {
          ...s,
          status: 'idle' as const,
          lastSyncedAt: new Date().toISOString(),
          lastRemoteUpdatedAt: updatedAt,
          error: null,
        }
        saveCloudSyncConfig(next)
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '同步上传失败'
      setCloudSyncState((s) => ({ ...s, status: 'error', error: message }))
    }
  }, [buildLocalSyncPayload])

  const pullCloudSync = useCallback(async () => {
    const cfg = cloudSyncRef.current
    if (!cfg.enabled || !cfg.roomId || !isCloudSyncAvailable()) return

    setCloudSyncState((s) => ({ ...s, status: 'syncing', error: null }))
    try {
      const remote = await pullFromCloud(cfg.roomId, cfg.pin)
      if (remote) {
        const remoteTs = new Date(remote.updatedAt).getTime()
        const localTs = cfg.lastRemoteUpdatedAt ? new Date(cfg.lastRemoteUpdatedAt).getTime() : 0
        if (remoteTs > localTs) {
          applyingRemoteRef.current = true
          dispatch({ type: 'HYDRATE_SYNC', payload: remote })
          applyingRemoteRef.current = false
        }
        setCloudSyncState((s) => {
          const next = {
            ...s,
            status: 'idle' as const,
            lastSyncedAt: new Date().toISOString(),
            lastRemoteUpdatedAt: remote.updatedAt,
            error: null,
          }
          saveCloudSyncConfig(next)
          return next
        })
      } else {
        setCloudSyncState((s) => ({ ...s, status: 'idle', error: null }))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '同步下载失败'
      setCloudSyncState((s) => ({ ...s, status: 'error', error: message }))
    }
  }, [])

  const syncNow = useCallback(async () => {
    await pullCloudSync()
    await pushCloudSync()
  }, [pullCloudSync, pushCloudSync])

  const generateSyncRoom = useCallback(() => generateRoomId(), [])

  useEffect(() => {
    if (!cloudSync.enabled || !cloudSync.roomId) return
    void pullCloudSync()
    const id = window.setInterval(() => void pullCloudSync(), 30_000)
    return () => window.clearInterval(id)
  }, [cloudSync.enabled, cloudSync.roomId, pullCloudSync])

  useEffect(() => {
    if (!cloudSync.enabled || !cloudSync.roomId || applyingRemoteRef.current) return
    window.clearTimeout(pushTimerRef.current)
    pushTimerRef.current = window.setTimeout(() => {
      void pushCloudSync()
    }, 3000)
    return () => window.clearTimeout(pushTimerRef.current)
  }, [
    cloudSync.enabled,
    cloudSync.roomId,
    state.quotes,
    state.positions,
    state.tTrades,
    state.alerts,
    state.bark,
    state.desktop,
    state.settings,
    pushCloudSync,
  ])

  const testBarkPush = useCallback(async () => {
    if (!state.bark.key.trim()) {
      toast('请先填写 Bark Key', 'error')
      return
    }
    const result = await sendBarkPush(state.bark, 'Stock Monitor 测试', 'Bark 推送通道正常')
    if (result.ok) toast('测试推送已发送', 'success')
    else toast(result.error ?? '推送失败', 'error')
  }, [state.bark, toast])

  const value: AppContextValue = {
    quotes: state.quotes,
    positions: state.positions,
    tTrades: state.tTrades,
    alerts: state.alerts,
    bark: state.bark,
    desktop: state.desktop,
    settings: state.settings,
    summary,
    lastRefreshedAt: state.lastRefreshedAt,
    quoteFeed: state.quoteFeed,
    toggleWatchlist,
    addStock,
    removeStock,
    reorderQuotes,
    reorderPositions,
    refreshQuotes,
    recordTTrade,
    upsertPosition,
    deletePosition,
    addAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    setBark: (partial) => dispatch({ type: 'SET_BARK', bark: partial }),
    setDesktop: (partial) => dispatch({ type: 'SET_DESKTOP', desktop: partial }),
    setSettings: (partial) => dispatch({ type: 'SET_SETTINGS', settings: partial }),
    getSparkline,
    getAIDiagnosis,
    generateAI,
    createShareLink,
    resetAllData: () => {
      Object.values(STORAGE_KEYS).forEach((key) => removeFromStorage(key))
      dispatch({ type: 'RESET_ALL' })
      toast('已重置全部数据', 'info')
    },
    testBarkPush,
    cloudSync,
    setCloudSyncConfig,
    generateSyncRoom,
    syncNow,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used within AppProvider')
  return ctx
}
