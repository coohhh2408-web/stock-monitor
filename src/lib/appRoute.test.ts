import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseAppRoute, researchHash, normalizeStockCode } from './appRoute.ts'

test('#research 打开选股页上的圆桌', () => {
  const route = parseAppRoute('', '#research')
  assert.equal(route.tab, 'screener')
  assert.equal(route.research, true)
  assert.equal(route.code, null)
  assert.equal(route.demoPush, false)
})

test('#/research/600519 带上代码', () => {
  const route = parseAppRoute('', '#/research/600519')
  assert.equal(route.research, true)
  assert.equal(route.code, '600519')
})

test('美股代码会大写', () => {
  assert.equal(normalizeStockCode('nvda'), 'NVDA')
  const route = parseAppRoute('', '#research/nvda')
  assert.equal(route.code, 'NVDA')
})

test('?open=research 不依赖 hash，给 iOS 热加载用', () => {
  const route = parseAppRoute('?mobile=1&open=research&code=600519', '')
  assert.equal(route.research, true)
  assert.equal(route.code, '600519')
  assert.equal(route.tab, 'screener')
})

test('#push 仍是来电预览，不会误开圆桌', () => {
  const route = parseAppRoute('', '#push')
  assert.equal(route.research, false)
  assert.equal(route.demoPush, true)
  assert.equal(route.tab, 'alert')
})

test('普通 tab hash 不变', () => {
  assert.equal(parseAppRoute('', '#position').tab, 'position')
  assert.equal(parseAppRoute('', '#screener').research, false)
  assert.equal(parseAppRoute('', '#unknown').tab, 'market')
})

test('researchHash 给关闭圆桌后的回写', () => {
  assert.equal(researchHash(), '#research')
  assert.equal(researchHash('nvda'), '#research/NVDA')
})
