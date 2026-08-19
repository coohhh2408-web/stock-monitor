#!/usr/bin/env node
/**
 * 通过 Supabase REST API 验证连接并检查 sync_rooms 表
 * 用法: node scripts/verify-sync.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')

if (!existsSync(envPath)) {
  console.error('❌ 未找到 .env，请先运行 npm run setup:supabase')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
    .filter(([k]) => k.startsWith('VITE_')),
)

const url = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ .env 缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('→ 验证 Supabase 连接...')
const res = await fetch(`${url}/rest/v1/sync_rooms?select=room_id&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})

if (res.status === 404 || res.status === 400) {
  const body = await res.text()
  if (body.includes('sync_rooms') || body.includes('relation') || res.status === 404) {
    console.error('❌ sync_rooms 表不存在，请在 Supabase SQL Editor 执行 supabase/schema.sql')
    process.exit(1)
  }
}

if (!res.ok) {
  console.error('❌ 连接失败:', res.status, await res.text())
  process.exit(1)
}

console.log('✅ Supabase 云端同步已就绪')
console.log('   启动: npm run dev')
console.log('   然后在 设置 → 云端多端同步 中启用')
