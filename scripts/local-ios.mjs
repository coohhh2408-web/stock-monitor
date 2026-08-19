#!/usr/bin/env node
/**
 * 在 Mac 本机：必要时启动 Vite，sync 热加载地址，然后 cap run 打开模拟器。
 * Linux / 云环境没有 Xcode，只打印拉分支说明。
 */
import os from 'node:os'
import { spawn } from 'node:child_process'

const DEVICE = process.argv.includes('--device')
const BRANCH = 'cursor/ios-native-shell-6f09'

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

const macHelp = `
请在 Mac 上用 Cursor 打开本仓库：

  git fetch origin && git checkout ${BRANCH} && git pull && npm install
  npm run ios:local
`.trim()

if (process.platform !== 'darwin') {
  console.log(`当前系统是 ${process.platform}，没有 Xcode，不能在这里点 Run。\n`)
  console.log(macHelp)
  process.exit(1)
}

const host = DEVICE ? lanIPv4() : '127.0.0.1'
if (DEVICE && !host) {
  console.error('找不到局域网 IP。连上 Wi-Fi 后再试。')
  process.exit(1)
}

const url = `http://${host}:5173`
const probes = DEVICE ? [url, 'http://127.0.0.1:5173'] : ['http://127.0.0.1:5173']

if (!(await waitForVite(probes, 2000))) {
  console.log('没检测到 Vite，正在后台启动 npm run dev …')
  startVite()
  if (!(await waitForVite(probes))) {
    console.error('Vite 没起来。请手动开一个终端运行 npm run dev 后再试。')
    process.exit(1)
  }
}

console.log(DEVICE ? `真机热加载 → ${url}` : `模拟器热加载 → ${url}`)
console.log('正在 cap sync …')
await run('npx', ['cap', 'sync', 'ios'], { CAP_SERVER_URL: url })

if (DEVICE) {
  await run('npx', ['cap', 'open', 'ios'])
  console.log('\nXcode 顶部选你的 iPhone，点 Run。第一次请允许本地网络。')
  process.exit(0)
}

console.log('正在启动模拟器（cap run）…')
await run('npx', ['cap', 'run', 'ios', '--no-sync'])
