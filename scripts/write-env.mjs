#!/usr/bin/env node
/**
 * 写入 .env（已有 Supabase 项目时使用）
 * 用法: node scripts/write-env.mjs <URL> <ANON_KEY>
 */
import { writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const [url, anonKey] = process.argv.slice(2)
if (!url?.includes('supabase.co') || !anonKey?.startsWith('ey')) {
  console.error('用法: node scripts/write-env.mjs https://xxx.supabase.co eyJhbG...')
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env')
const content = `# Supabase 云端同步 — 自动生成
VITE_SUPABASE_URL=${url.replace(/\/$/, '')}
VITE_SUPABASE_ANON_KEY=${anonKey}
`

writeFileSync(envPath, content)
console.log('✅ 已写入', envPath)
console.log('   URL:', url.replace(/\/$/, ''))
