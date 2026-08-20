import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bandHint, priceSeat } from './sageBand.ts'

test('现价略低于下沿仍算在区内，不能理解成再涨一点才买', () => {
  assert.equal(priceSeat(58.08, 58.33, 83.33), 'in-band')
  assert.equal(bandHint('in-band'), '现价已在区内')
})

test('明显高于上沿才是等回落', () => {
  assert.equal(priceSeat(90, 58.33, 83.33), 'rich')
  assert.equal(bandHint('rich'), '现价高出沿，要等回落')
})

test('明显低于下沿是更便宜，不是等它涨回去', () => {
  assert.equal(priceSeat(50, 58.33, 83.33), 'cheap')
  assert.equal(bandHint('cheap'), '现价低于下沿')
})
