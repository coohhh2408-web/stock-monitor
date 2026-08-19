import { encryptJson, decryptJson } from '@/lib/crypto'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'
import type { CloudSyncState, SyncPayload, SyncPayloadInput } from '@/types/cloudSync'
import { DEFAULT_CLOUD_SYNC } from '@/types/cloudSync'

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function isCloudSyncAvailable(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function generateRoomId(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join('')
}

export function loadCloudSyncConfig(): CloudSyncState {
  const saved = loadFromStorage<Partial<CloudSyncState>>(STORAGE_KEYS.cloudSync, {})
  return {
    ...DEFAULT_CLOUD_SYNC,
    ...saved,
    status: isCloudSyncAvailable() ? 'idle' : 'offline',
    error: null,
  }
}

export function saveCloudSyncConfig(config: CloudSyncState): void {
  saveToStorage(STORAGE_KEYS.cloudSync, {
    enabled: config.enabled,
    roomId: config.roomId,
    pin: config.pin,
    lastSyncedAt: config.lastSyncedAt,
    lastRemoteUpdatedAt: config.lastRemoteUpdatedAt,
  })
}

export function buildSyncPayload(input: SyncPayloadInput): SyncPayload {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    ...input,
  }
}

function supabaseHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

function supabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '')
}

async function encryptPayload(payload: SyncPayload, roomId: string, pin: string): Promise<string> {
  const secret = pin.trim() || roomId
  return encryptJson(JSON.stringify(payload), secret, `stock-monitor:${roomId}`)
}

async function decryptPayload(ciphertext: string, roomId: string, pin: string): Promise<SyncPayload> {
  const secret = pin.trim() || roomId
  const json = await decryptJson(ciphertext, secret, `stock-monitor:${roomId}`)
  const parsed = JSON.parse(json) as SyncPayload
  if (parsed.version !== 1) throw new Error('不支持的同步数据版本')
  return parsed
}

export async function pushToCloud(
  roomId: string,
  pin: string,
  payload: SyncPayload,
): Promise<string> {
  if (!isCloudSyncAvailable()) throw new Error('云端同步未配置')

  const encrypted = await encryptPayload(payload, roomId, pin)
  const updatedAt = payload.updatedAt

  const res = await fetch(`${supabaseUrl()}/rest/v1/sync_rooms`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      room_id: roomId,
      payload: encrypted,
      updated_at: updatedAt,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `上传失败 (${res.status})`)
  }

  return updatedAt
}

export async function pullFromCloud(roomId: string, pin: string): Promise<SyncPayload | null> {
  if (!isCloudSyncAvailable()) throw new Error('云端同步未配置')

  const res = await fetch(
    `${supabaseUrl()}/rest/v1/sync_rooms?room_id=eq.${encodeURIComponent(roomId)}&select=payload,updated_at`,
    { headers: supabaseHeaders() },
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `下载失败 (${res.status})`)
  }

  const rows = (await res.json()) as { payload: string; updated_at: string }[]
  if (!rows.length) return null

  const payload = await decryptPayload(rows[0].payload, roomId, pin)
  return { ...payload, updatedAt: rows[0].updated_at || payload.updatedAt }
}
