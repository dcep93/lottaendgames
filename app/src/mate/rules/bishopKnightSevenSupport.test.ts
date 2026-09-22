import assert from 'node:assert/strict'
import test from 'node:test'
import { findPiece, getChess, kingDistance, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, bishopKnightRuleSet, scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('recorded seven-diagonal positions retain support except same-file anchored kings', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const blackReply of ['Kb5', 'Ka5']) {
      const original = getChess('8/8/8/3B4/3K4/k2N4/8/8 w - - 16 9')
      const board = getChess(transformFen(original.fen(), transform))
      for (const san of ['Kc3', 'Ka4', 'Kb2', blackReply, 'Bb3']) {
        const move = original.move(san)
        const before = board.fen()
        const reflected = board.move({from: transformSquare(move.from, transform), to: transformSquare(move.to, transform)}).san
        if (move.color === 'w') {
          const sameFile = findPiece(original.fen(), 'w', 'k')!.square[0] === findPiece(original.fen(), 'b', 'k')!.square[0]
          assert.equal(scoreKnightAndBishopWhiteMove(before, reflected).supportedDiagonalSizeScore, sameFile ? 99 : 7)
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


test('seven bishop and seven knight reject same-file kings after White, including reflected axes', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('6B1/3k4/8/8/8/2KN4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const san = board.move({from: transformSquare('c3', transform), to: transformSquare('d4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, san).supportedDiagonalSizeScore, 99)
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(board.fen()), '1/2')
    // A support change does not itself prohibit a move when every candidate is unsupported.
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [san])
    const cases = [
      '6B1/3k4/8/8/4K3/3N4/8/8 b - - 1 1',
      // Approaching the seven-square is outside this new anchored-knight restriction.
      '6B1/3k4/8/8/3K4/8/5N2/8 b - - 1 1',
    ] as const
    for (const fen of cases) {
      const f = transformFen(fen, transform)
      assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(f), '2/2')
    }
  }
})
