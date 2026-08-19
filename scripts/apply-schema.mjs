#!/usr/bin/env node
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const token = process.env.SUPABASE_ACCESS_TOKEN
const projectId = process.argv[2]
if (!token || !projectId) {
  console.error('Usage: SUPABASE_ACCESS_TOKEN=... node scripts/apply-schema.mjs <project-id>')
  process.exit(1)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const query = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8')

const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})

if (!res.ok) {
  console.error('Schema apply failed:', res.status, await res.text())
  process.exit(1)
}

console.log('Schema applied')
