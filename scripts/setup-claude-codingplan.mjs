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
import { join } from 'path'
import { createInterface } from 'readline/promises'
import { stdin as input, stdout as output } from 'process'

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

  const providerName = (process.env.CODING_PLAN_PROVIDER || args.provider || 'aliyun').toLowerCase()
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
    return
  }

  console.log(`== Claude Code × ${provider.label} ==\n`)
  console.log(`控制台: ${provider.consoleUrl}`)
  console.log(`Base URL: ${provider.baseUrl}`)
  console.log(`API Key: ${provider.keyHint}\n`)

  let apiKey = process.env.CODING_PLAN_API_KEY || args.key
  let model = process.env.CODING_PLAN_MODEL || args.model || provider.defaultModel

  const needsPrompt = !apiKey || (!args.model && !process.env.CODING_PLAN_MODEL)
  if (needsPrompt) {
    const rl = createInterface({ input, output })
    try {
      if (!apiKey) {
        apiKey = await prompt(rl, `请输入 Coding Plan API Key: `)
      }
      if (!apiKey) {
        console.error('未提供 API Key。可设环境变量 CODING_PLAN_API_KEY 或用 --key 传入。')
        process.exit(1)
      }
      if (!args.model && !process.env.CODING_PLAN_MODEL) {
        const customModel = await prompt(rl, `模型名 [${model}]: `, model)
        model = customModel
      }
    } finally {
      rl.close()
    }
  } else if (!apiKey) {
    console.error('未提供 API Key。可设环境变量 CODING_PLAN_API_KEY 或用 --key 传入。')
    process.exit(1)
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
