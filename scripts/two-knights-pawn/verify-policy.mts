/** Independent chess.js replay of a reproducible sample from the exported policy. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import {
  Chess,
  type Square,
} from '../../app/node_modules/chess.js/dist/esm/chess.js'
import data from '../../app/src/mate/rules/twoKnightsPawnTableData.json'
import {
  installTwoKnightsPawnTable,
  twoKnightsPawnEntry,
} from '../../app/src/mate/rules/twoKnightsPawnTable'
const bytes = gunzipSync(
  readFileSync(new URL(`../../app/public${data.url}`, import.meta.url)),
)
const buffer = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
)
installTwoKnightsPawnTable(buffer)
const records = new DataView(buffer),
  size = 6 * 64 * 2016 * 64
const pairs: number[][] = []
for (let a = 0; a < 64; a++) for (let b = a + 1; b < 64; b++) pairs.push([a, b])
const sq = (s: number) => ('abcdefgh'[s % 8]! + String(1 + (s >> 3))) as Square
function board(key: number) {
  const black = key >= size
  let n = key % size
  const k = n % 64
  n = Math.floor(n / 64)
  const [a, b] = pairs[n % 2016]!
  n = Math.floor(n / 2016)
  const w = n % 64,
    p = (Math.floor(n / 64) + 1) * 8 + 7
  const c = new Chess()
  c.clear()
  for (const [s, type, color] of [
    [w, 'k', 'w'],
    [k, 'k', 'b'],
    [a!, 'n', 'w'],
    [b!, 'n', 'w'],
    [p, 'p', 'b'],
  ] as const)
    c.put({ type, color }, sq(s))
  return new Chess(c.fen().replace(' w ', black ? ' b ' : ' w '))
}
let edges = 0
for (let i = 0; i < data.records; i += Math.floor(data.records / 2500)) {
  const c = board(records.getUint32(i * 8, true)),
    e = twoKnightsPawnEntry(c.fen())!
  assert(e)
  if (c.isCheckmate()) {
    assert.equal(e.plies, 0)
    continue
  }
  const legal = c.moves({ verbose: true })
  const selected =
    c.turn() === 'w'
      ? legal.filter((m) => m.from === e.from && m.to === e.to)
      : legal
  assert(selected.length)
  let worst = 0
  for (const m of selected) {
    c.move(m)
    const child = twoKnightsPawnEntry(c.fen())
    assert(child || c.isCheckmate(), c.fen())
    if (child) {
      assert(child.stage <= e.stage)
      if (child.stage === e.stage)
        assert.equal(
          c.turn() === 'b'
            ? child.distance + 1 <= e.distance
            : child.distance <= e.distance,
          true,
        )
    }
    worst = Math.max(worst, 1 + (child?.plies ?? 0))
    c.undo()
    edges++
  }
  assert.equal(worst, e.plies)
}
// Whole witness paths, including the globally longest certified White start.
const starts = [...Object.values(data.samples), data.audit.turns[0]!.worstIndex]
for (let i = 0; i < data.records / 2; i += Math.floor(data.records / 64))
  starts.push(records.getUint32(i * 8, true))
for (const key of starts) {
  const c = board(key)
  const total = twoKnightsPawnEntry(c.fen())!.plies
  let steps = 0
  while (!c.isCheckmate()) {
    const e = twoKnightsPawnEntry(c.fen())
    assert(e)
    const legal = c.moves({ verbose: true })
    let move = legal.find((m) => m.from === e.from && m.to === e.to)
    if (c.turn() === 'b') {
      let best = -1
      for (const m of legal) {
        c.move(m)
        const d = twoKnightsPawnEntry(c.fen())?.plies ?? 0
        c.undo()
        if (d > best) {
          best = d
          move = m
        }
      }
    }
    assert(move)
    c.move(move)
    assert(++steps <= total)
  }
  assert.equal(steps, total)
}
console.log(
  `Verified ${edges} sampled runtime edges and ${starts.length} complete worst-resistance paths with chess.js.`,
)
