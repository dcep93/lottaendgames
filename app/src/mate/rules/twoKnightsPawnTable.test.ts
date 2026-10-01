import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { test } from 'node:test'
import data from './twoKnightsPawnTableData.json'
import { loadTwoKnightsPawnTable, twoKnightsPawnTableReady, twoKnightsPawnEntry } from './twoKnightsPawnTable'

test('lookup download rejects corrupt data, retries, and shares one successful load', async () => {
  assert.equal(twoKnightsPawnTableReady(), false)
  await assert.rejects(loadTwoKnightsPawnTable((async () => new Response(null, {status:503})) as typeof fetch), /Could not load/)
  await assert.rejects(loadTwoKnightsPawnTable((async () => new Response(gzipSync('corrupt'))) as typeof fetch), /checksum/)
  assert.equal(twoKnightsPawnTableReady(), false)
  let calls = 0
  const fetcher = (async (url: string) => {
    calls++
    assert.equal(url, data.url)
    return new Response(readFileSync(new URL(`../../../public${data.url}`, import.meta.url)))
  }) as typeof fetch
  await Promise.all([loadTwoKnightsPawnTable(fetcher), loadTwoKnightsPawnTable(fetcher)])
  assert.equal(calls, 1)
  assert.equal(twoKnightsPawnTableReady(), true)
  assert(twoKnightsPawnEntry('3k4/7p/8/8/8/6N1/8/1N1K4 w - - 0 1'))
})
