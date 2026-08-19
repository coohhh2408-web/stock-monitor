#!/usr/bin/env node
/**
 * 在 Mac 本机把 iOS 模拟器/真机接到 Vite。
 * 云环境和 Linux 没有 Xcode，脚本会打印拉分支命令后退出。
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

const macHelp = `
请在 Mac 上用 Cursor 打开本仓库，然后：

  git fetch origin
  git checkout ${BRANCH}
  git pull origin ${BRANCH}
  npm install

终端 1：
  npm run dev

终端 2（模拟器，同一台 Mac）：
  npm run ios:local

真机（iPhone 与 Mac 同一 Wi-Fi）：
  npm run ios:device

网页还没定型：改 src/ 即可，不要在 Swift 里复制页面。
`.trim()

if (process.platform !== 'darwin') {
  console.log(`当前系统是 ${process.platform}，没有 Xcode，不能在这里跑 iOS。\n`)
  console.log(macHelp)
  process.exit(1)
}

const host = DEVICE ? lanIPv4() : '127.0.0.1'
if (DEVICE && !host) {
  console.error('找不到局域网 IP。连上 Wi-Fi 后再试，或手动设置：')
  console.error('  CAP_SERVER_URL=http://192.168.x.x:5173 npm run ios:live')
  process.exit(1)
}

const url = `http://${host}:5173`
if (!(await viteUp(url)) && !(await viteUp('http://127.0.0.1:5173'))) {
  console.error('没检测到 Vite。请先在另一个终端运行：\n  npm run dev\n然后再执行本命令。')
  process.exit(1)
}

console.log(DEVICE ? `真机热加载 → ${url}` : `模拟器热加载 → ${url}`)
console.log('正在 cap sync（会把地址写进 iOS 工程，不要把 IP 提交进 git）…')

await run('npx', ['cap', 'sync', 'ios'], { CAP_SERVER_URL: url })
await run('npx', ['cap', 'open', 'ios'])

console.log('\n在 Xcode 选模拟器或你的 iPhone，点 Run。')
console.log('改 React 保存后，App 里刷新即可，一般不必再 sync。')
