import assert from 'node:assert/strict'
import test from 'node:test'
import {allSquares, getChess, SQUARE_TRANSFORMS, transformFen} from '../chess'
import {knightAndBishopSupportedDiagonal} from './bishopKnightDiagonalSupport'

test('Bc6 and reflections never support a diagonal regardless of knight placement or old declarations', () => {
  for (const fen of [
    '8/2k5/2B5/2K5/8/8/8/8 b - - 1 1', // Loaded Kc5 result.
    '8/8/2B5/k7/3K4/8/8/8 b - - 1 1', // Former Kd4/Nd5 exception.
    '8/8/2B5/k2K4/8/8/8/8 b - - 1 1', // Former Kd5/Nd3 exception.
    '4K3/2k5/2B5/8/8/8/8/8 b - - 1 1', // Former approaching-knight exception.
  ]) {
    for (const square of allSquares()) {
      const board = getChess(fen)
      if (board.get(square)) continue
      board.put({type: 'n', color: 'w'}, square)
      for (const transform of SQUARE_TRANSFORMS) {
        assert.deepEqual(knightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)), {size: 99, knight: 99})
      }
    }
  }
})
