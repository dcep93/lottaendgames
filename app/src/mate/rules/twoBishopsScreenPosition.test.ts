import assert from 'node:assert/strict'
import test from 'node:test'
import { Chess, type Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getIdealTwoBishopsWhiteMoves,
} from './twoBishops'
import { evaluateRuleBScreenPosition } from './twoBishopsScreenPosition'

const FLEXIBLE_BISHOP_SQUARES = [
  'd1',
  'e2',
  'f3',
  'g4',
  'h5',
] as const satisfies readonly Square[]

function screenFen(flexibleBishop: Square): string {
  const chess = new Chess()
  chess.clear()
  chess.put({ color: 'b', type: 'k' }, 'f1')
  chess.put({ color: 'w', type: 'k' }, 'g3')
  chess.put({ color: 'w', type: 'b' }, 'h4')
  chess.put({ color: 'w', type: 'b' }, flexibleBishop)
  return chess.fen()
}

for (const flexibleBishop of FLEXIBLE_BISHOP_SQUARES) {
  test(`rule b scores Kh3 with the flexible bishop on ${flexibleBishop}`, () => {
    const fen = screenFen(flexibleBishop)
    const evaluation = evaluateRuleBScreenPosition(fen)
    assert.equal(evaluation.applies, true)
    if (flexibleBishop !== 'e2') {
      assert.equal(evaluation.penaltiesBySan.get('Kh3'), 0)
    }
  })
}

test('rule b uniquely selects Kh3 in the supplied screen position', () => {
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(screenFen('d1')), ['Kh3'])
})

test('rule b supports every rotation and reflection', () => {
  const fen = screenFen('d1')
  const canonicalMove = getChess(fen).move('Kh3')
  assert.ok(canonicalMove)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expectedFrom = transformSquare(canonicalMove.from, transform)
    const expectedTo = transformSquare(canonicalMove.to, transform)
    assert.ok(
      getIdealTwoBishopsWhiteMoves(transformedFen).some((san) => {
        const move = getChess(transformedFen).move(san)
        return move.from === expectedFrom && move.to === expectedTo
      }),
      transform.name,
    )
  }
})

test('rule b rejects near-miss screen positions', () => {
  for (const fen of [
    '8/8/8/8/7B/6K1/8/3Bk3 w - - 0 1',
    '8/8/8/8/6KB/8/8/3B1k2 w - - 0 1',
    '8/8/8/7B/8/6K1/8/3B1k2 w - - 0 1',
  ]) {
    assert.equal(evaluateRuleBScreenPosition(fen).applies, false)
  }
})
