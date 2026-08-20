import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clampView, defaultView, panView, zoomView } from './chartViewport.ts'

test('默认窗口贴在最新一段', () => {
  const view = defaultView('day', 400)
  assert.equal(view.end, 400)
  assert.equal(view.size, 80)
})

test('向右拖露出更早的柱，不会拖出左边界', () => {
  const start = { end: 400, size: 80 }
  const panned = panView(start, 400, 30)
  assert.equal(panned.end, 370)
  assert.equal(panned.size, 80)
  const wall = panView({ end: 80, size: 80 }, 400, 50)
  assert.equal(wall.end, 80)
})

test('缩放绕锚点，不会小于下限', () => {
  const view = { end: 400, size: 80 }
  const inZoom = zoomView(view, 400, 0.5, 360)
  assert.ok(inZoom.size < 80)
  assert.ok(inZoom.size >= 12)
  const out = zoomView(view, 400, 8, 399)
  assert.equal(out.size, 240)
  assert.equal(out.end, 400)
})

test('柱很少时窗口等于全部', () => {
  const view = clampView(20, 80, 20)
  assert.equal(view.end, 20)
  assert.equal(view.size, 20)
})
