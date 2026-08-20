const FULLWIDTH = /[０-９]/g

function normalizeNumeric(raw: string): string {
  return raw
    .replace(FULLWIDTH, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 48))
    .replace(/[^\d.,\-]/g, '')
    .replace(/,/g, '')
    .trim()
}

export function parseShareCount(raw: string): number | null {
  const n = Number.parseInt(normalizeNumeric(raw), 10)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function parseCostPrice(raw: string): number | null {
  const n = Number.parseFloat(normalizeNumeric(raw))
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}
