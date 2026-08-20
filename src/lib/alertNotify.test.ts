import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reconcileAlertNotifications, sameAlertIdSet } from './alertNotify.ts'
import { coverIdentity } from './stealthCover.ts'

test('已在区内的提醒再次对账时不会重报', () => {
  const first = reconcileAlertNotifications(new Set(), ['a1', 'a5'])
  assert.deepEqual(first.fireIds, ['a1', 'a5'])
  const again = reconcileAlertNotifications(first.notified, ['a1', 'a5'])
  assert.deepEqual(again.fireIds, [])
  assert.equal(sameAlertIdSet(first.notified, again.notified), true)
})

test('价格回到区外后再涨破才第二次提醒', () => {
  const fired = reconcileAlertNotifications(new Set(), ['a1'])
  const cooled = reconcileAlertNotifications(fired.notified, [])
  assert.equal(cooled.notified.has('a1'), false)
  const recross = reconcileAlertNotifications(cooled.notified, ['a1'])
  assert.deepEqual(recross.fireIds, ['a1'])
})

test('新触发的规则会加入待响列表', () => {
  const first = reconcileAlertNotifications(new Set(['a1']), ['a1', 'a2'])
  assert.deepEqual(first.fireIds, ['a2'])
  assert.equal(first.notified.has('a1'), true)
  assert.equal(first.notified.has('a2'), true)
})

test('掩护身份对同一代码稳定', () => {
  const a = coverIdentity('SH600089')
  const b = coverIdentity('SH600089')
  assert.equal(a.name, b.name)
  assert.equal(a.line, b.line)
  assert.match(a.line, /手机/)
  assert.ok(coverIdentity('AAPL').name.length > 0)
})
