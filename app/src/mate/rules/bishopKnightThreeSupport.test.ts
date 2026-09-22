import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('three-diagonal support accepts adjacent kings and rejects remote kings', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of ['k1B5/8/8/3N4/8/8/8/7K b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99)
    }
    for (const fen of ['k1B5/3K4/8/3N4/8/8/8/8 b - - 0 1', 'k1B5/8/8/1K1N4/8/8/8/8 b - - 0 1']) {
      assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 3)
    }
  }
})

test('three-diagonal support is evaluated after White moves and bishop safety still applies', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/k2K4/B7/3N4/8/8/8/8 w - - 0 1', transform)
    const move = (to: 'c7' | 'c6') => getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare(to, transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c6')).supportedDiagonalSizeScore, 99)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c7')).pieceSafetyScore, 1)
  }
})


test('Ba6 accepts Kc6 but rejects Kc5 beyond the five-diagonal, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/B1K5/3N4/8/8/8/8 b - - 0 1', transform)).size, 3)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/B7/2KN4/8/8/8/8 b - - 0 1', transform)).size, 99)
    const fen = transformFen('k7/8/2K5/1B1N4/8/8/8/8 w - - 2 2', transform)
    const san = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('a6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).supportedDiagonalSizeScore, 3)
    // A remote knight cannot qualify while Kc6 has no target.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('k7/8/B1K5/8/8/8/7N/8 b - - 0 1', transform)).size, 99)
  }
})
