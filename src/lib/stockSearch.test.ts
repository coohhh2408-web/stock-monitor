import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSinaSuggest, parseTencentHint } from './stockSearch.ts'

test('腾讯建议能搜到格力电器，并丢掉指数和基金', () => {
  const hits = parseTencentHint(
    'sz~000651~格力电器~gldq~GP-A^sz~301260~格力博~glb~GP-A^jj~000651~招商基金~zszj~KJ-HB^sh~000847~腾讯济安~txja~ZS',
  )
  assert.equal(hits[0]?.name, '格力电器')
  assert.equal(hits[0]?.code, '000651')
  assert.equal(hits[0]?.market, 'a-share')
  assert.equal(hits.some((row) => row.name === '腾讯济安' || row.name === '招商基金'), false)
})

test('腾讯建议能解析港股和美股代码', () => {
  const hits = parseTencentHint('hk~00700~腾讯控股~txkg~GP^us~aapl.oq~苹果~pg~GP')
  assert.deepEqual(
    hits.map((row) => [row.name, row.code, row.market]),
    [
      ['腾讯控股', '00700', 'hk-stock'],
      ['苹果', 'AAPL', 'us-stock'],
    ],
  )
})

test('新浪建议按中文名能解析格力电器', () => {
  const hits = parseSinaSuggest('格力电器,11,000651,sz000651,格力电器,,格力电器,99,1,ESG,,')
  assert.equal(hits[0]?.name, '格力电器')
  assert.equal(hits[0]?.code, '000651')
  assert.equal(hits[0]?.market, 'a-share')
})
