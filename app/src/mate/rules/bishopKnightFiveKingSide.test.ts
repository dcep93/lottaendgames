import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen } from '../chess'
import { evaluateKnightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'

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
      // An earlier declared placement still qualifies when White is to the right.
      '8/3B4/8/k2K4/8/3N4/8/8 b - - 0 1',
      // A five knight is not subject to the previous-stage-knight restriction.
      '3k4/8/2B5/2KN4/8/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})
