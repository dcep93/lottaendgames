/** Small repeatable Node benchmark; includes FEN parsing in lookup timing. */
import { readFileSync, writeFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'
import { installTwoKnightsPawnTable, twoKnightsPawnEntry } from '../../app/src/mate/rules/twoKnightsPawnTable'
import { getIdealTwoKnightsPawnWhiteMoves } from '../../app/src/mate/rules/twoKnightsPawn'
const metadata = JSON.parse(readFileSync(new URL('../../app/src/mate/rules/twoKnightsPawnTableData.json',import.meta.url),'utf8'))
const fixtures = JSON.parse(readFileSync(new URL('../../app/src/mate/rules/twoKnightsPawnTableFixtures.json',import.meta.url),'utf8'))
const compressed = readFileSync(new URL('../../app/public'+metadata.url,import.meta.url))
let started = performance.now()
const raw = gunzipSync(compressed)
const decompressionMs = performance.now()-started
started = performance.now()
installTwoKnightsPawnTable(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength))
const installMs = performance.now()-started
for(const p of fixtures.positions)twoKnightsPawnEntry(p.fen)
const lookups=10000
started = performance.now()
for(let i=0;i<lookups;i++)twoKnightsPawnEntry(fixtures.positions[i%fixtures.positions.length].fen)
const lookupUs = (performance.now()-started)*1000/lookups
for(let i=0;i<10;i++)getIdealTwoKnightsPawnWhiteMoves(metadata.startFen)
started = performance.now()
const recommendations=200
for(let i=0;i<recommendations;i++)getIdealTwoKnightsPawnWhiteMoves(metadata.startFen)
const recommendationMs = (performance.now()-started)/recommendations
const result={runtime:process.version,compressedBytes:compressed.byteLength,tableBytes:raw.byteLength,rankIndexBytes:(Math.ceil(metadata.slots/8/256)+1)*4,decompressionMs,installMs,lookupUs,recommendationMs}
writeFileSync(new URL('./work/custom-tablebase-data/benchmark.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
