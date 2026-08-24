#!/usr/bin/env node
/**
 * 配置 Claude Code 接入 Coding Plan API（Anthropic 兼容协议）
 *
 * 用法:
 *   CODING_PLAN_API_KEY=sk-sp-xxx npm run setup:claude-codingplan
 *   npm run setup:claude-codingplan -- --provider aliyun --key sk-sp-xxx --model qwen3.7-plus
 *   npm run setup:claude-codingplan -- --check
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCAL_KEY_FILES = [
  join(ROOT, '.codingplan.local'),
  join(ROOT, '.env.codingplan'),
  join(homedir(), '.codingplan.local'),
]

function readLocalKeyFile() {
  for (const path of LOCAL_KEY_FILES) {
    if (!existsSync(path)) continue
    const text = readFileSync(path, 'utf8')
    const lines = text.split(/\r?\n/)
    let key = ''
    let provider = ''
    let model = ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) {
        if (!key && line.startsWith('sk-')) key = line
        continue
      }
      const name = line.slice(0, eq).trim()
      const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      if (name === 'CODING_PLAN_API_KEY' || name === 'ANTHROPIC_AUTH_TOKEN') key = value
      if (name === 'CODING_PLAN_PROVIDER') provider = value
      if (name === 'CODING_PLAN_MODEL' || name === 'ANTHROPIC_MODEL') model = value
    }
    if (key) return { key, provider, model, path }
  }
  return null
}

const PROVIDERS = {
  aliyun: {
    label: '阿里云百炼 Coding Plan',
    baseUrl: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    defaultModel: 'qwen3.7-plus',
    keyHint: 'sk-sp- 开头（Coding Plan 专属 Key，勿用普通 sk- Key）',
    consoleUrl: 'https://bailian.console.aliyun.com/?tab=model#/efm/coding_plan',
    settings(model, apiKey) {
      return {
        env: {
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_BASE_URL: this.baseUrl,
          ANTHROPIC_MODEL: model,
          ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
          ANTHROPIC_DEFAULT_SONNET_MODEL: model,
          ANTHROPIC_DEFAULT_OPUS_MODEL: model,
          CLAUDE_CODE_SUBAGENT_MODEL: model,
          API_TIMEOUT_MS: '300000',
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
        },
      }
    },
  },
  volcengine: {
    label: '火山引擎方舟 Coding Plan',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding',
    defaultModel: 'ark-code-latest',
    keyHint: '方舟控制台 API Key',
    consoleUrl: 'https://console.volcengine.com/ark',
    settings(model, apiKey) {
      return {
        env: {
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_BASE_URL: this.baseUrl,
          ANTHROPIC_MODEL: model,
          API_TIMEOUT_MS: '300000',
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
        },
      }
    },
  },
  tencent: {
    label: '腾讯云 Coding Plan',
    baseUrl: 'https://api.lkeap.cloud.tencent.com/coding/anthropic',
    defaultModel: 'hunyuan-lite',
    keyHint: 'sk-sp- 开头（Coding Plan 专属 Key）',
    consoleUrl: 'https://console.cloud.tencent.com/lkeap/coding-plan',
    settings(model, apiKey) {
      return {
        env: {
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_BASE_URL: this.baseUrl,
          ANTHROPIC_MODEL: model,
          API_TIMEOUT_MS: '300000',
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
        },
      }
    },
  },
}

function parseArgs(argv) {
  const args = { provider: 'aliyun', key: '', model: '', check: false, force: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--check') args.check = true
    else if (arg === '--force') args.force = true
    else if (arg === '--provider') args.provider = argv[++i]
    else if (arg === '--key') args.key = argv[++i]
    else if (arg === '--model') args.model = argv[++i]
    else if (arg === '--help' || arg === '-h') args.help = true
  }
  return args
}

function printHelp() {
  console.log(`Claude Code × Coding Plan 一键配置

用法:
  CODING_PLAN_API_KEY=sk-sp-xxx npm run setup:claude-codingplan
  npm run setup:claude-codingplan -- --provider aliyun --key sk-sp-xxx
  npm run setup:claude-codingplan -- --check

也可用本地私密文件（已 gitignore）:
  .codingplan.local  或  .env.codingplan  或  ~/.codingplan.local
  内容示例:
    CODING_PLAN_API_KEY=sk-sp-xxx
    CODING_PLAN_PROVIDER=aliyun
    CODING_PLAN_MODEL=qwen3.7-plus

选项:
  --provider aliyun|volcengine|tencent   默认 aliyun
  --key <api-key>                        Coding Plan 专属 API Key
  --model <model>                        模型名（默认随 provider）
  --check                                只检查现有配置
  --force                                覆盖已有 settings.json

环境变量:
  CODING_PLAN_API_KEY   同 --key
  CODING_PLAN_PROVIDER  同 --provider
  CODING_PLAN_MODEL     同 --model

配置完成后:
  1. 新开终端窗口
  2. claude --version   # 确认已安装
  3. claude "你好"      # 测试对话
  4. 在 Claude Code 里执行 /status 核对 Base URL 和 Key
`)
}

function readJson(path) {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function checkConfig(claudeDir, claudeJsonPath) {
  const settings = readJson(join(claudeDir, 'settings.json'))
  const claudeJson = readJson(claudeJsonPath)
  const env = settings?.env ?? {}

  console.log('== Claude Code 配置检查 ==\n')
  console.log('settings.json:', existsSync(join(claudeDir, 'settings.json')) ? '✓ 存在' : '✗ 缺失')
  console.log('~/.claude.json:', existsSync(claudeJsonPath) ? '✓ 存在' : '✗ 缺失')
  console.log('hasCompletedOnboarding:', claudeJson?.hasCompletedOnboarding === true ? '✓ true' : '✗ 未设置（会尝试连 Anthropic 官方登录）')
  console.log('ANTHROPIC_BASE_URL:', env.ANTHROPIC_BASE_URL || '(未设置)')
  console.log('ANTHROPIC_MODEL:', env.ANTHROPIC_MODEL || '(未设置)')
  const token = env.ANTHROPIC_AUTH_TOKEN || ''
  console.log('ANTHROPIC_AUTH_TOKEN:', token ? `${token.slice(0, 8)}…${token.slice(-4)}` : '(未设置)')

  const knownBase = Object.values(PROVIDERS).some((p) => p.baseUrl === env.ANTHROPIC_BASE_URL)
  if (env.ANTHROPIC_BASE_URL && !knownBase) {
    console.log('\n⚠ Base URL 不在已知 Coding Plan 列表内，请确认是否填对。')
  }
  if (env.ANTHROPIC_BASE_URL?.includes('coding.dashscope') && !token.startsWith('sk-sp-')) {
    console.log('\n⚠ 阿里云 Coding Plan 应使用 sk-sp- 专属 Key，普通 sk- Key 会按量扣费。')
  }
  console.log('')
}

async function prompt(rl, question, fallback = '') {
  const answer = (await rl.question(question)).trim()
  return answer || fallback
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const local = readLocalKeyFile()
  const providerName = (
    process.env.CODING_PLAN_PROVIDER ||
    args.provider ||
    local?.provider ||
    'aliyun'
  ).toLowerCase()
  const provider = PROVIDERS[providerName]
  if (!provider) {
    console.error(`未知 provider: ${providerName}，可选: ${Object.keys(PROVIDERS).join(', ')}`)
    process.exit(1)
  }

  const claudeDir = join(homedir(), '.claude')
  const claudeJsonPath = join(homedir(), '.claude.json')
  const settingsPath = join(claudeDir, 'settings.json')

  if (args.check) {
    checkConfig(claudeDir, claudeJsonPath)
    if (local) console.log(`本地 Key 文件: ${local.path}（已检测到，未打印明文）\n`)
    else console.log('本地 Key 文件: 未找到（.codingplan.local / .env.codingplan / ~/.codingplan.local）\n')
    return
  }

  console.log(`== Claude Code × ${provider.label} ==\n`)
  console.log(`控制台: ${provider.consoleUrl}`)
  console.log(`Base URL: ${provider.baseUrl}`)
  console.log(`API Key: ${provider.keyHint}\n`)
  if (local?.path) console.log(`已读取本地 Key 文件: ${local.path}\n`)

  let apiKey = process.env.CODING_PLAN_API_KEY || args.key || local?.key || ''
  let model =
    process.env.CODING_PLAN_MODEL || args.model || local?.model || provider.defaultModel

  const hasModelOverride = Boolean(
    process.env.CODING_PLAN_MODEL || args.model || local?.model,
  )
  const needsPrompt = !apiKey || !hasModelOverride
  if (needsPrompt) {
    if (!input.isTTY) {
      if (!apiKey) {
        console.error('未提供 API Key。')
        console.error('任选其一：')
        console.error('  1. CODING_PLAN_API_KEY=sk-sp-xxx npm run setup:claude-codingplan')
        console.error('  2. 在仓库根目录写 .codingplan.local（见 .codingplan.local.example）')
        console.error('  3. npm run setup:claude-codingplan -- --key sk-sp-xxx --force')
        process.exit(1)
      }
    } else {
      const rl = createInterface({ input, output })
      try {
        if (!apiKey) {
          apiKey = await prompt(rl, `请输入 Coding Plan API Key: `)
        }
        if (!apiKey) {
          console.error('未提供 API Key。可设环境变量 CODING_PLAN_API_KEY 或用 --key 传入。')
          process.exit(1)
        }
        if (!hasModelOverride) {
          const customModel = await prompt(rl, `模型名 [${model}]: `, model)
          model = customModel
        }
      } finally {
        rl.close()
      }
    }
  }

  if (providerName === 'aliyun' && !apiKey.startsWith('sk-sp-')) {
    console.warn('\n⚠ 警告: 阿里云 Coding Plan Key 通常以 sk-sp- 开头。用普通 sk- Key 可能无法走套餐额度。\n')
  }

  if (existsSync(settingsPath) && !args.force) {
    console.error(`已存在 ${settingsPath}`)
    console.error('若要覆盖，请加 --force')
    checkConfig(claudeDir, claudeJsonPath)
    process.exit(1)
  }

  mkdirSync(claudeDir, { recursive: true })

  const settings = provider.settings(model, apiKey)
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 4)}\n`)
  console.log(`✅ 已写入 ${settingsPath}`)

  const claudeJson = readJson(claudeJsonPath) ?? {}
  claudeJson.hasCompletedOnboarding = true
  writeFileSync(claudeJsonPath, `${JSON.stringify(claudeJson, null, 2)}\n`)
  console.log(`✅ 已更新 ${claudeJsonPath}（hasCompletedOnboarding: true）`)

  console.log(`
下一步:
  1. 若未安装 Claude Code: npm install -g @anthropic-ai/claude-code
  2. 新开一个终端窗口（让配置生效）
  3. 在本项目目录运行: claude "你好"
  4. 在 Claude Code 里输入 /status 确认 Base URL 指向 Coding Plan

常见问题:
  - 401 invalid_api_key → Key 类型与 Base URL 不匹配，确认用的是 Coding Plan 专属 Key
  - 连到 api.anthropic.com → 检查 hasCompletedOnboarding 是否为 true，并重开终端
  - 模型不可用 → 到控制台确认该模型在套餐支持列表里
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
