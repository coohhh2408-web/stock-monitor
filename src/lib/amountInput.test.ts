import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCostPrice, parseShareCount } from './amountInput.ts'

test('股数能读普通数字和全角数字', () => {
  assert.equal(parseShareCount('100'), 100)
  assert.equal(parseShareCount('１００'), 100)
  assert.equal(parseShareCount(' 100 '), 100)
  assert.equal(parseShareCount('0'), null)
  assert.equal(parseShareCount(''), null)
})

test('成本能读小数，逗号当千分位丢掉', () => {
  assert.equal(parseCostPrice('87.57'), 87.57)
  assert.equal(parseCostPrice('1,688.50'), 1688.5)
  assert.equal(parseCostPrice('0'), null)
})
