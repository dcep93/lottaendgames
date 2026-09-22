import assert from 'node:assert/strict'
import test from 'node:test'
import { findPiece, getChess, kingDistance, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, bishopKnightRuleSet, scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('recorded seven-diagonal positions retain support when White is at least as close to the bishop', () => {
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


test('same-file seven kings reject support only when Black is closer to the bishop, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('6B1/3k4/8/8/8/2KN4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const san = board.move({from: transformSquare('c3', transform), to: transformSquare('d4', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, san).supportedDiagonalSizeScore, 99)
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(board.fen()), '1/2')
    // A support change does not itself prohibit a move when every candidate is unsupported.
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [san])
    const cases = [
      // Same-file kings: White is closer, then an equal-distance tie.
      '8/8/8/1k6/8/1B1N4/1K6/8 b - - 3 2',
      '8/8/3k4/3B4/3K4/3N4/8/8 b - - 1 1',
      '6B1/3k4/8/8/4K3/3N4/8/8 b - - 1 1',
    ] as const
    for (const fen of cases) {
      const f = transformFen(fen, transform)
      assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(f), '2/2')
    }
  }
})


test('loaded second-move Bb3 is supported and preferred before Kc6 replies', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/8/8/1k6/8/3N4/BK6/8 w - - 2 2', transform)
    const board = getChess(before)
    const san = board.move({from: transformSquare('a2', transform), to: transformSquare('b3', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, san).supportedDiagonalSizeScore, 7)
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(board.fen()), '2/2')
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [san])
  }
})


test('same-file seven support uses Euclidean bishop distance even when king-step distances tie', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3k2B1/8/2K5/8/8/3N4/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('c6', transform), to: transformSquare('d6', transform)}).san
    // Both kings are three king steps from Bg8, but Black is 3 Euclidean units
    // away and White is sqrt(13) units away.
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(board.fen()), '1/2')
  }
})


test('seven support rejects a king not to Black’s right when Black is closer, including an approaching knight', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('3k2B1/8/8/3KN3/8/8/8/8 w - - 0 1', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('d5', transform), to: transformSquare('d6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(board.fen()), '1/2')
    const ke6 = getChess(before).move({from: transformSquare('d5', transform), to: transformSquare('e6', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(before, ke6).supportedDiagonalSizeScore, 99)
    for (const fen of [
      '6B1/3k4/8/8/3K4/8/5N2/8 b - - 1 1',
      // Strictly left, with the knight already on d3.
      '6B1/4k3/8/8/3K4/3N4/8/8 b - - 1 1',
    ]) assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(transformFen(fen, transform)), '1/2')
  }
})
