import assert from 'node:assert/strict'
import './twoKnightsPawnTestSetup'
import { test } from 'node:test'
import { Chess } from 'chess.js'
import data from './twoKnightsPawnTableData.json'
import { twoKnightsPawnEntry } from './twoKnightsPawnTable'
import {
  getIdealTwoKnightsPawnWhiteMoves,
  getIdealTwoKnightsPawnBlackMoves,
  getTwoKnightsPawnTerminalOutcome,
  twoKnightsPawnWhiteRules,
  twoKnightsPawnRuleSet,
} from './twoKnightsPawn'
import { TWO_KNIGHTS_PAWN_POSITIONS } from '../catalog'
import {
  validateMatePosition,
  transformFen,
  getSquareTransform,
} from '../chess'

test('h-pawn policy has exactly the requested stages and excludes knight captures', () => {
  assert.deepEqual(
    twoKnightsPawnWhiteRules.map((r) => r.id),
    ['r1', 'r2', 'r3'],
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome('8/8/8/8/8/4K2p/4N2k/8 w - - 0 1'),
    'lost-knight',
  )
  assert.equal(
    getTwoKnightsPawnTerminalOutcome('3k4/7p/8/8/8/8/8/1N1K2N1 w - - 0 1'),
    'unsupported',
  )
  assert.equal(
    twoKnightsPawnRuleSet.help.noteLinks?.[0]?.href.startsWith(
      'https://lichess.org/analysis/pgn/',
    ),
    true,
  )
})
test('generated starts replay to mate with monotonically advancing stages', () => {
  for (const source of [
    ...TWO_KNIGHTS_PAWN_POSITIONS.standard,
    ...TWO_KNIGHTS_PAWN_POSITIONS.train,
  ]) {
    const chess = new Chess(source.fen)
    const entry = twoKnightsPawnEntry(chess.fen())
    assert(entry, source.fen)
    let stage = 3,
      plies = 0
    const seen = new Set<string>()
    while (!chess.isCheckmate()) {
      const e = twoKnightsPawnEntry(chess.fen())
      assert(e, chess.fen())
      assert(e.stage <= stage)
      stage = e.stage
      const key = chess.fen().split(' ').slice(0, 2).join(' ')
      assert(!seen.has(key))
      seen.add(key)
      const moves =
        chess.turn() === 'w'
          ? getIdealTwoKnightsPawnWhiteMoves(chess.fen())
          : getIdealTwoKnightsPawnBlackMoves(chess.fen())
      assert(moves.length)
      chess.move(moves[0]!)
      assert(++plies < 300)
    }
    assert.equal(plies, entry.plies)
    assert.equal(getTwoKnightsPawnTerminalOutcome(chess.fen()), 'checkmate')
    assert.equal(
      validateMatePosition(
        'two-knights-pawn',
        transformFen(source.fen, getSquareTransform('mirrorFile')),
      ).ok,
      false,
    )
  }
})
test('only certified promotion endings remain playable and deliver immediate mate', () => {
  const pairs: number[][] = []
  for (let a = 0; a < 64; a++)
    for (let b = a + 1; b < 64; b++) pairs.push([a, b])
  const square = (s: number) =>
    ('abcdefgh'[s % 8]! + String(1 + (s >> 3))) as import('chess.js').Square
  for (const [id] of data.promotions) {
    let n = id!
    const k = n % 64
    n = Math.floor(n / 64)
    const [a, b] = pairs[n % 2016]!
    const w = Math.floor(n / 2016) % 64
    for (const type of ['q', 'r', 'b', 'n'] as const) {
      const c = new Chess()
      c.clear()
      c.put({ type: 'k', color: 'w' }, square(w))
      c.put({ type: 'k', color: 'b' }, square(k))
      for (const s of [a!, b!]) c.put({ type: 'n', color: 'w' }, square(s))
      c.put({ type, color: 'b' }, 'h1')
      const e = twoKnightsPawnEntry(c.fen())
      assert.equal(e?.stage, 1)
      assert.equal(getTwoKnightsPawnTerminalOutcome(c.fen()), null)
      const moves = getIdealTwoKnightsPawnWhiteMoves(c.fen())
      assert.equal(moves.length, 1)
      c.move(moves[0]!)
      assert(c.isCheckmate())
    }
  }
})
