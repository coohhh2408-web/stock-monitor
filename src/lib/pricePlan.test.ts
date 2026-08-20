import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  collectPlanTriggers,
  effectiveStopLoss,
  evaluatePricePlan,
  formatRewardRisk,
  normalizePricePlan,
  planAlertId,
  planArmIds,
  planFromDraft,
  priceFromPercent,
  tickPlanPeaks,
} from './pricePlan.ts'

function quote(price: number) {
  return { code: 'SH600519', name: '贵州茅台', price }
}

test('空计划不落盘', () => {
  assert.equal(normalizePricePlan({ code: 'SH600519' }), null)
})

test('从现价估算止盈止损，不是建议价', () => {
  assert.equal(priceFromPercent(100, -8), 92)
  assert.equal(priceFromPercent(100, 10), 110)
})

test('硬止损和回撤跟踪同时存在时，取更贴身的那条', () => {
  const plan = normalizePricePlan({
    code: 'SH600519',
    stopLoss: 90,
    trailPercent: 8,
    peakPrice: 100,
  })
  assert.ok(plan)
  assert.equal(effectiveStopLoss(plan), 92)
})

test('硬止损高于跟踪止损时，以硬止损为准', () => {
  const plan = normalizePricePlan({
    code: 'SH600519',
    stopLoss: 95,
    trailPercent: 8,
    peakPrice: 100,
  })
  assert.ok(plan)
  assert.equal(effectiveStopLoss(plan), 95)
})

test('现价创新高会抬高跟踪止损，但不改硬止损', () => {
  const before = normalizePricePlan({
    code: 'SH600519',
    stopLoss: 90,
    trailPercent: 8,
    peakPrice: 100,
  })
  assert.ok(before)
  const after = tickPlanPeaks({ SH600519: before }, [{ code: 'SH600519', price: 120 }])
  assert.equal(after.SH600519.peakPrice, 120)
  assert.equal(after.SH600519.updatedAt, before.updatedAt)
  assert.equal(effectiveStopLoss(after.SH600519), 110.4)
})

test('高点未刷新时不复制计划对象', () => {
  const plan = normalizePricePlan({
    code: 'SH600519',
    trailPercent: 8,
    peakPrice: 100,
  })
  assert.ok(plan)
  const plans = { SH600519: plan }
  assert.equal(tickPlanPeaks(plans, [{ code: 'SH600519', price: 99 }]), plans)
})

test('涨到止盈、跌到止损才算触发', () => {
  const plan = normalizePricePlan({
    code: 'SH600519',
    takeProfit: 110,
    stopLoss: 90,
  })
  assert.ok(plan)
  assert.equal(evaluatePricePlan(plan, 109.99).tpHit, false)
  assert.equal(evaluatePricePlan(plan, 110).tpHit, true)
  assert.equal(evaluatePricePlan(plan, 90.01).slHit, false)
  assert.equal(evaluatePricePlan(plan, 90).slHit, true)
})

test('盈亏比用现价当参照，止盈相对止损的空间', () => {
  const plan = normalizePricePlan({
    code: 'SH600519',
    takeProfit: 115,
    stopLoss: 90,
  })
  const seat = evaluatePricePlan(plan, 100)
  assert.equal(seat.rewardRisk, 1.5)
  assert.equal(formatRewardRisk(seat.rewardRisk), '1.5R')
  assert.ok(seat.railPct != null)
  assert.equal(Math.round((seat.railPct ?? 0) * 100), 40)
})

test('改止盈止损会重武装对应提醒，改高点不会', () => {
  const prev = normalizePricePlan({ code: 'A', takeProfit: 110, stopLoss: 90, trailPercent: 8, peakPrice: 100 })
  const nextTp = normalizePricePlan({ code: 'A', takeProfit: 120, stopLoss: 90, trailPercent: 8, peakPrice: 105 })
  assert.deepEqual(planArmIds(prev, nextTp), [planAlertId('A', 'tp')])
  const nextSl = normalizePricePlan({ code: 'A', takeProfit: 110, stopLoss: 88, trailPercent: 8, peakPrice: 105 })
  assert.deepEqual(planArmIds(prev, nextSl), [planAlertId('A', 'sl')])
  const cleared = planArmIds(prev, null)
  assert.ok(cleared.includes(planAlertId('A', 'tp')))
  assert.ok(cleared.includes(planAlertId('A', 'sl')))
})

test('收集到价触发时止盈止损可以同时命中', () => {
  const plan = normalizePricePlan({ code: 'SH600519', takeProfit: 100, stopLoss: 100 })
  assert.ok(plan)
  const hits = collectPlanTriggers({ SH600519: plan }, [quote(100)])
  assert.equal(hits.length, 2)
  assert.deepEqual(hits.map((h) => h.kind).sort(), ['sl', 'tp'])
})

test('草稿覆盖字段，未填的沿用旧计划', () => {
  const prev = normalizePricePlan({ code: 'SH600519', takeProfit: 110, stopLoss: 90 })
  const next = planFromDraft('SH600519', { trailPercent: 8 }, 100, prev)
  assert.ok(next)
  assert.equal(next.takeProfit, 110)
  assert.equal(next.stopLoss, 90)
  assert.equal(next.trailPercent, 8)
  assert.equal(next.peakPrice, 100)
})
