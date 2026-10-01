import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gzipSync, gunzipSync } from 'node:zlib'
import { test } from 'node:test'
import data from './twoKnightsPawnTableData.json'
import { loadTwoKnightsPawnTable, twoKnightsPawnTableReady, twoKnightsPawnEntry } from './twoKnightsPawnTable'
import { createServer } from 'node:http'
import { once } from 'node:events'

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

// A fresh module instance exercises the real Fetch behavior separately from
// the opaque gzip response above. Browsers (and Node Fetch) decode this header.
test('HTTP gzip responses are not decompressed twice', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, {'Content-Encoding': 'gzip'})
    res.end(readFileSync(new URL(`../../../public${data.url}`, import.meta.url)))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    const address = server.address() as {port:number}
    const response = await fetch(`http://127.0.0.1:${address.port}`)
    const raw = await response.arrayBuffer()
    assert.equal(raw.byteLength, data.bytes)
    const fresh = await import('./twoKnightsPawnTable' + '?http-gzip')
    await fresh.loadTwoKnightsPawnTable((async () => new Response(raw, {headers:{'Content-Encoding':'gzip'}})) as typeof fetch)
    assert(fresh.twoKnightsPawnEntry('3k4/7p/8/8/8/6N1/8/1N1K4 w - - 0 1'))
    assert.deepEqual(Buffer.from(raw), gunzipSync(readFileSync(new URL(`../../../public${data.url}`, import.meta.url))))
  } finally {
    server.closeAllConnections()
    server.close()
  }
})
