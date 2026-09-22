import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { evaluateKnightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'

test('Nd3 five-diagonal support requires the White king strictly right of Black after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      // The loaded loop: same file, then White to Black's left.
      '8/2k5/2B5/2K5/8/3N4/8/8 b - - 1 1',
      '3k4/8/2B5/2K5/8/3N4/8/8 b - - 3 2',
      // The older nearby-kings Bd7 allowance cannot bypass the strict condition.
      '3k4/3B4/3K4/8/8/3N4/8/8 b - - 0 1',
    ]) assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1',
      // An earlier remote-a4 placement still qualifies when White is to the right.
      '8/8/1k6/3K4/B7/3N4/8/8 b - - 0 1',
      // A five knight is not subject to the previous-stage-knight restriction.
      '3k4/8/2B5/2KN4/8/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('Nd3 requires the five bishop on a4 or adjacent to White, even for older declarations', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      // Loaded 1. Bd7: the king on c5 is two steps from the bishop.
      '8/1k1B4/8/2K5/8/3N4/8/8 b - - 1 1',
      // The earlier exact Kd5/Bd7 placement cannot bypass the new condition.
      '8/3B4/8/k2K4/8/3N4/8/8 b - - 0 1',
    ]) assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '8/1k6/8/2K5/B7/3N4/8/8 b - - 0 1',
      '8/1k1B4/2K5/8/8/3N4/8/8 b - - 0 1',
      '8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1',
      // Actual five knights retain their existing support classification.
      '8/1k1B4/8/2KN4/8/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('the declared position immediately after second-move Bc6 is supported in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '46 24']) {
      const before = transformFen(`8/8/8/k2K4/B7/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)}).san
      assert.equal(evaluateKnightAndBishopSupportedDiagonal(board.fen()).size, 5)
      assert.ok(getIdealKnightAndBishopWhiteMoves(before).includes(move))
    }
    // This is an exact declaration, not a new general Kd5/Bc6 allowance.
    const nearby = transformFen('8/8/1kB5/3K4/8/3N4/8/8 b - - 0 1', transform)
    assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(nearby).size, 5)
  }
})
