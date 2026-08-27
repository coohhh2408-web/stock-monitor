#!/usr/bin/env node
/**
 * 本机一条命令：必要时自己起 Vite，sync 热加载地址，再 cap run。
 * 不要再开第二个终端，也不要再把 IP / 地址搬到 Xcode。
 * Linux / 云环境没有 Xcode，只打印本机要跑的那一条。
 */
import os from 'node:os'
import { spawn, execFileSync } from 'node:child_process'

const DEVICE = process.argv.includes('--device')
const RESEARCH = process.argv.includes('--research')
const PAGES = process.argv.includes('--pages')
const WEB_PAGES_URL = 'https://coohhh2408-web.github.io/stock-monitor/'

function lanIPv4() {
  const ifs = os.networkInterfaces()
  const preferred = ['en0', 'en1', 'eth0', 'wlan0']
  for (const name of preferred) {
    for (const row of ifs[name] ?? []) {
      const family = row.family === 4 || row.family === 'IPv4'
      if (family && !row.internal) return row.address
    }
  }
  for (const rows of Object.values(ifs)) {
    for (const row of rows ?? []) {
      const family = row.family === 4 || row.family === 'IPv4'
      if (family && !row.internal) return row.address
    }
  }
  return null
}

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
      shell: false,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} 退出码 ${code}`))
    })
  })
}

async function viteUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

async function waitForVite(urls, ms = 25000) {
  const started = Date.now()
  while (Date.now() - started < ms) {
    for (const url of urls) {
      if (await viteUp(url)) return true
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

function startVite() {
  const child = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
}

function bootedIPhoneTarget() {
  try {
    const out = execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted'], {
      encoding: 'utf8',
    })
    const match = out.match(/iPhone[^\n]*\(([0-9A-F-]{36})\)\s+\(Booted\)/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function connectedDeviceTarget() {
  let text = ''
  try {
    text = execFileSync('xcrun', ['xctrace', 'list', 'devices'], { encoding: 'utf8' })
  } catch (err) {
    text = `${err.stdout ?? ''}${err.stderr ?? ''}${err.message ?? ''}`
  }
  const section = text.split('== Simulators ==')[0] ?? text
  for (const line of section.split('\n')) {
    if (!/iphone/i.test(line) || /simulator/i.test(line)) continue
    const groups = [...line.matchAll(/\(([^)]+)\)/g)].map((m) => m[1])
    const udid = groups.at(-1)
    if (udid && !/^\d+\.\d+/.test(udid)) return udid
  }
  return null
}

function withOpenQuery(base) {
  const url = new URL(base.endsWith('/') ? base : `${base}/`)
  if (RESEARCH) {
    url.searchParams.set('open', 'research')
  }
  return url.toString()
}

const macCmd = DEVICE
  ? 'git pull && npm install && npm run ios:device -- --research'
  : 'git pull && npm install && npm run ios:research'

if (process.platform !== 'darwin') {
  console.log(`当前系统是 ${process.platform}，没有 Xcode。\n`)
  console.log('本机一条命令：')
  console.log(`  ${macCmd}`)
  process.exit(1)
}

let origin
if (PAGES) {
  origin = WEB_PAGES_URL
} else if (DEVICE) {
  const host = lanIPv4()
  if (!host) {
    console.error('找不到局域网 IP。连上 Wi-Fi 后再跑：')
    console.error(`  ${macCmd}`)
    process.exit(1)
  }
  origin = `http://${host}:5173/`
} else {
  origin = 'http://127.0.0.1:5173/'
}

const url = withOpenQuery(origin)
const probes = PAGES
  ? []
  : DEVICE
    ? [origin, 'http://127.0.0.1:5173/']
    : ['http://127.0.0.1:5173/']

if (!PAGES) {
  if (!(await waitForVite(probes, 2000))) {
    console.log('没检测到 Vite，正在后台启动 npm run dev …')
    startVite()
    if (!(await waitForVite(probes))) {
      console.error('Vite 没起来。本机再跑这一条（不要另开窗口搬地址）：')
      console.error(`  ${macCmd}`)
      process.exit(1)
    }
  }
}

console.log(DEVICE ? `真机热加载 → ${url}` : PAGES ? `正式站 → ${url}` : `模拟器热加载 → ${url}`)
console.log('正在 cap sync …')
await run('npx', ['cap', 'sync', 'ios'], { CAP_SERVER_URL: url })

if (DEVICE) {
  const target = connectedDeviceTarget()
  if (!target) {
    console.error('没看到已连接的 iPhone。插上解锁后只跑这一条：')
    console.error(`  ${macCmd}`)
    process.exit(1)
  }
  console.log(`正在装到真机 ${target}（cap run，不打开 Xcode）…`)
  await run('npx', ['cap', 'run', 'ios', '--no-sync', '--target', target])
  process.exit(0)
}

console.log('正在启动模拟器（cap run）…')
const target = bootedIPhoneTarget()
await run(
  'npx',
  target
    ? ['cap', 'run', 'ios', '--no-sync', '--target', target]
    : ['cap', 'run', 'ios', '--no-sync'],
)
