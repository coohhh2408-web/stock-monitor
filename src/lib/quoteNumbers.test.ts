import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  deriveTurnover,
  formatPercentRate,
  openVsPrevAccent,
  parsePositiveNumber,
  parseTencentQuoteFields,
} from './quoteNumbers.ts'

const LUOYANG_MOLY =
  'v_sh603993="1~洛阳钼业~603993~18.27~18.00~18.48~2214630~1097210~1117420~18.27~4709~18.26~1020~18.25~2252~18.24~4764~18.23~2220~18.28~1580~18.29~1300~18.30~2486~18.31~325~18.32~281~~20260820161451~0.27~1.50~18.95~18.13~18.27/2214630/4107722547~2214630~410772~1.27~14.05~~18.95~18.13~4.56~3190.10~3908.74~4.36~19.80~16.20~1.00~8993~18.55~12.10~19.22~~~2.63~410772.2547~401.2092~2196~";'

test('腾讯盘口换手走 38 档，市盈动走 52 档，不是把空档当 0', () => {
  const q = parseTencentQuoteFields(LUOYANG_MOLY)
  assert.ok(q)
  assert.equal(q.name, '洛阳钼业')
  assert.equal(q.prevClose, 18)
  assert.equal(q.open, 18.48)
  assert.equal(q.high, 18.95)
  assert.equal(q.low, 18.13)
  assert.equal(q.volume, 2214630)
  assert.equal(q.turnover, 1.27)
  assert.equal(q.pe, 12.1)
  assert.equal(q.peTtm, 19.22)
  assert.equal(q.amplitude, 4.56)
  assert.equal(q.pb, 4.36)
})

test('东财盘前换手 0.0 要丢掉，不能盖掉腾讯的 1.27', () => {
  assert.equal(parsePositiveNumber(0), null)
  assert.equal(parsePositiveNumber(0.0), null)
  assert.equal(parsePositiveNumber('-'), null)
  assert.equal(parsePositiveNumber(1.27), 1.27)
})

test('换手 0 在格子里显示为破折号，不是 0.00%', () => {
  assert.equal(formatPercentRate(0), '—')
  assert.equal(formatPercentRate(1.27), '1.27%')
  assert.equal(formatPercentRate(undefined), '—')
})

test('今开涨跌色对比昨收', () => {
  assert.equal(openVsPrevAccent(18.48, 18.27), 'up')
  assert.equal(openVsPrevAccent(18.0, 18.27), 'down')
  assert.equal(openVsPrevAccent(18.27, 18.27), 'none')
})

test('没有换手时可用成交额 / 流通值估一个', () => {
  const rate = deriveTurnover(4_107_720_000, 3_190_1000_0000)
  assert.ok(rate !== undefined)
  assert.ok(Math.abs(rate - 1.29) < 0.05)
})
