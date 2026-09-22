import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {getIdealKnightAndBishopWhiteMoves} from './bishopKnight'
import {knightAndBishopFiveBishopPenalty, knightAndBishopSupportedDiagonal} from './bishopKnightDiagonalSupport'

test('Nd3 permits remote Bd7 and prefers it when Bb5 fails other support requirements', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/k1B5/2K5/8/3N4/8/8 w - - 0 1', transform)
    const moves: Record<string, string> = {}
    for (const [to, size, penalty] of [['b5', 99, 0], ['d7', 5, 1], ['a4', 5, 2]] as const) {
      const board = getChess(fen)
      moves[to] = board.move({from: transformSquare('c6', transform), to: transformSquare(to, transform)}).san
      assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, size)
      assert.equal(knightAndBishopFiveBishopPenalty(board.fen()), penalty)
    }
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [moves.d7])
    // Removing adjacency does not waive the king-side requirement.
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('8/2kB4/8/2K5/8/3N4/8/8 b - - 1 1', transform)).size, 99)
  }
})
