import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../chess'
import { scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('removed corner-approach preference contributes no scoring fields', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/5k2/8/4BN2/5K2/8/8 w - - 0 1', transform)
    for (const move of getChess(fen).moves()) {
      assert.ok(!('cornerKingApproachScore' in scoreKnightAndBishopWhiteMove(fen, move)))
    }
  }
})
