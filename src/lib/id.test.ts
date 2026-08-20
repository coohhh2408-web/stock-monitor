import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newId } from './id.ts'

test('没有 randomUUID 时也能生成持仓 id', () => {
  const original = crypto.randomUUID
  // @ts-expect-error 测局域网 http 预览
  crypto.randomUUID = undefined
  const id = newId()
  crypto.randomUUID = original
  assert.match(id, /^[0-9a-f-]{36}$/)
})
