import assert from 'node:assert/strict'
import test from 'node:test'
import { findPiece, getChess, kingDistance, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('recorded seven-diagonal positions retain support in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const blackReply of ['Kb5', 'Ka5']) {
      const original = getChess('8/8/8/3B4/3K4/k2N4/8/8 w - - 16 9')
      const board = getChess(transformFen(original.fen(), transform))
      for (const san of ['Kc3', 'Ka4', 'Kb2', blackReply, 'Bb3']) {
        const move = original.move(san)
        const before = board.fen()
        const reflected = board.move({from: transformSquare(move.from, transform), to: transformSquare(move.to, transform)}).san
        if (move.color === 'w') {
          assert.equal(scoreKnightAndBishopWhiteMove(before, reflected).supportedDiagonalSizeScore, 7)
        }
      }
      const white = findPiece(board.fen(), 'w', 'k')!.square
      const black = findPiece(board.fen(), 'b', 'k')!.square
      for (const square of ['f6', 'g7'] as const) {
        const target = transformSquare(square, transform)
        assert.ok(kingDistance(white, target) <= kingDistance(black, target))
      }
    }
  }
})
