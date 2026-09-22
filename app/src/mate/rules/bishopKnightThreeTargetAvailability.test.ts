import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, transformFen, getChess, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal, knightAndBishopShouldCheckThreeDiagonal } from './bishopKnightDiagonalSupport'
import { scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('three targets remain absent at Kd7 and Kb5 even when an exact declaration supplies support', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, size, knight] of [
      ['1kB5/3K4/8/1N6/8/8/8/8 b - - 1 1', 3, 99],
      ['k7/3K4/B7/1N6/8/8/8/8 b - - 3 2', 99, 99],
      ['k1B5/3K4/8/3N4/8/8/8/8 b - - 1 1', 99, 99],
      ['k1B5/8/8/1K1N4/8/8/8/8 b - - 1 1', 99, 99],
      ['k1B5/2K5/8/1N6/8/8/8/8 b - - 1 1', 3, 0],
      ['k7/8/BK6/8/3N4/8/8/8 b - - 1 1', 3, 1],
      ['1k6/8/B1K5/N7/8/8/8/8 b - - 1 1', 99, 99],
    ] as const) {
      const reflected = transformFen(fen, transform)
      assert.deepEqual(knightAndBishopSupportedDiagonal(reflected), {size, knight}, fen + transform.name)
      assert.deepEqual(knightAndBishopSupportedDiagonal(reflected.replace(/\d+ \d+$/, '73 42')), {size, knight})
    }
    // No target also means r1 cannot request a knight-support check.
    assert.equal(knightAndBishopShouldCheckThreeDiagonal(transformFen('k1B5/3K4/8/8/3N4/8/8/8 w - - 0 1', transform)), false)
    const before = transformFen('1k6/3K4/B7/1N6/8/8/8/8 w - - 0 1', transform)
    const bc8 = getChess(before).move({from: transformSquare('a6', transform), to: transformSquare('c8', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, bc8).supportedDiagonalSizeScore, 3)
  }
})
