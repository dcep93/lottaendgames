import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'

test('loaded Be8 fails support while the approaching knight requires b5 or its reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '72 42']) {
      const fen = transformFen(`8/2k5/4K3/8/B7/4N3/8/8 w - - ${counters}`, transform)
      const move = (to: 'e8' | 'd7') => getChess(fen).move({from: transformSquare('a4', transform), to: transformSquare(to, transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move('e8')).supportedDiagonalSizeScore, 99)
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move('d7')).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('d7')])
    }
    for (const fen of [
      '1k6/8/8/1BKN4/8/8/8/8 b - - 1 1', // Established five-knight remains eligible with Bb5.
      '8/1k6/3K4/8/B7/3N4/8/8 b - - 1 1', // Previous-stage Nd3 remains eligible with Ba4.
      '3k4/8/4K3/1B6/5N2/8/8/8 b - - 1 1', // Bb5 permits the approaching Nf4.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})
