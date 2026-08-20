import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '@/lib/storage'
import { newId } from '@/lib/id'
import type { ShareViewStub } from '@/types/alert'
import type { QuoteItem } from '@/types/market'
import type { PositionItem } from '@/types/position'
import type { AlertRule } from '@/types/alert'

export interface ShareSnapshot {
  id: string
  createdAt: string
  expiresAt: string
  quotes: QuoteItem[]
  positions: PositionItem[]
  alerts: AlertRule[]
}

export type ShareRoute =
  | { type: 'local'; id: string }
  | { type: 'encoded'; payload: string }

const MAX_SHARE_URL_LENGTH = 8000

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function gzipToBase64Url(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  const buffer = await new Response(stream).arrayBuffer()
  return base64UrlEncode(new Uint8Array(buffer))
}

async function gunzipFromBase64Url(encoded: string): Promise<string> {
  const bytes = base64UrlDecode(encoded)
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

async function encodeSnapshot(snapshot: ShareSnapshot): Promise<string> {
  const json = JSON.stringify(snapshot)
  if (typeof CompressionStream !== 'undefined') {
    return gzipToBase64Url(json)
  }
  return base64UrlEncode(new TextEncoder().encode(json))
}

async function decodeSnapshot(encoded: string): Promise<ShareSnapshot | null> {
  try {
    let json: string
    if (typeof DecompressionStream !== 'undefined') {
      try {
        json = await gunzipFromBase64Url(encoded)
      } catch {
        json = new TextDecoder().decode(base64UrlDecode(encoded))
      }
    } else {
      json = new TextDecoder().decode(base64UrlDecode(encoded))
    }
    const parsed = JSON.parse(json) as ShareSnapshot
    if (!parsed?.quotes || !parsed?.positions || !parsed?.alerts) return null
    return parsed
  } catch {
    return null
  }
}

export function parseShareRoute(hash: string): ShareRoute | null {
  const encoded = hash.match(/^#\/share\/d\/([^/?#]+)/)
  if (encoded) return { type: 'encoded', payload: encoded[1] }

  const local = hash.match(/^#\/share\/([a-z0-9-]+)/i)
  if (local && local[1] !== 'd') return { type: 'local', id: local[1] }

  return null
}

export async function resolveShareSnapshot(route: ShareRoute): Promise<ShareSnapshot | null> {
  if (route.type === 'local') return loadShareSnapshot(route.id)
  return decodeSnapshot(route.payload)
}

export async function generateShareLink(
  data: Omit<ShareSnapshot, 'id' | 'createdAt' | 'expiresAt'>,
): Promise<ShareViewStub> {
  const id = newId().slice(0, 8)
  const now = new Date()
  const expires = new Date(now)
  expires.setDate(expires.getDate() + 30)

  const snapshot: ShareSnapshot = {
    id,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString().slice(0, 10),
    ...data,
  }

  const existing = loadFromStorage<ShareSnapshot[]>(STORAGE_KEYS.shareViews, [])
  saveToStorage(STORAGE_KEYS.shareViews, [...existing, snapshot])

  const encoded = await encodeSnapshot(snapshot)
  const base = `${window.location.origin}${window.location.pathname}`
  const shareUrl = `${base}#/share/d/${encoded}`

  if (shareUrl.length > MAX_SHARE_URL_LENGTH) {
    const localUrl = `${base}#/share/${id}`
    return {
      status: 'ready',
      shareUrl: localUrl,
      expiresAt: snapshot.expiresAt,
      isReadOnly: true,
    }
  }

  return {
    status: 'ready',
    shareUrl,
    expiresAt: snapshot.expiresAt,
    isReadOnly: true,
  }
}

export function loadShareSnapshot(id: string): ShareSnapshot | null {
  const views = loadFromStorage<ShareSnapshot[]>(STORAGE_KEYS.shareViews, [])
  return views.find((v) => v.id === id) ?? null
}
