import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen } from '../chess'
import { knightAndBishopDeclaredPreparationMove } from './bishopKnightPreparation'

test('previous r5 declarations not explicitly restored remain removed in every reflection', () => {
  for (const fen of [
    '8/8/3k4/5K2/4B3/3N4/8/8 w - - 0 1',
    '8/4k3/8/2N2K2/4B3/8/8/8 w - - 0 1',
    '8/8/4k3/6K1/4B3/3N4/8/8 w - - 0 1',
    '8/8/3k2K1/8/4B3/3N4/8/8 w - - 0 1',
    '8/8/5k2/2N5/3KB3/8/8/8 w - - 0 1',
    '8/5k2/8/4K3/4B3/4N3/8/8 w - - 0 1',
    '8/8/3Nk3/2K5/4B3/8/8/8 w - - 0 1',
    '8/8/2KN4/4k3/4B3/8/8/8 w - - 0 1',
  ]) for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(knightAndBishopDeclaredPreparationMove(transformFen(fen, transform)), undefined, fen)
  }
})
