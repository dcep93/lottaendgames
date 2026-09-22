import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { evaluateKnightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'

test('Nd3 five-diagonal support allows same-file kings but rejects White left of Black after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      // White to Black's left stays excluded.
      '3k4/8/2B5/2K5/8/3N4/8/8 b - - 3 2',
    ]) assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1',
      '8/2k5/8/2K5/B7/3N4/8/8 b - - 1 1',
      '3k4/3B4/3K4/8/8/3N4/8/8 b - - 0 1',
      // An earlier remote-a4 placement still qualifies when White is to the right.
      '8/8/1k6/3K4/B7/3N4/8/8 b - - 0 1',
      // A five knight is not subject to the previous-stage-knight restriction.
      '3k4/8/1K6/1B1N4/8/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('Nd3 permits a4 and d7 without adjacency, including older declarations', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      // Loaded 1. Bd7: the king on c5 is two steps from the bishop.
      '8/1k1B4/8/2K5/8/3N4/8/8 b - - 1 1',
      // The earlier exact Kd5/Bd7 placement is eligible again.
      '8/3B4/8/k2K4/8/3N4/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '8/1k6/8/2K5/B7/3N4/8/8 b - - 0 1',
      '8/1k1B4/2K5/8/8/3N4/8/8 b - - 0 1',
      '8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1',
      // Actual five knights retain their existing support classification.
      '8/1k1B4/8/2KN4/8/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('the former second-move Bc6 support declaration is superseded in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '46 24']) {
      const before = transformFen(`8/8/8/k2K4/B7/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      board.move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)})
      assert.equal(evaluateKnightAndBishopSupportedDiagonal(board.fen()).size, 99)
      const bd7 = getChess(before).move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [bd7])
    }
    // Nearby Bc6 placements are also unsupported.
    const nearby = transformFen('8/8/1kB5/3K4/8/3N4/8/8 b - - 0 1', transform)
    assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(nearby).size, 5)
  }
})


test('same-file kings permit loaded Ba4 while Bb5 still fails other support requirements', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const before = transformFen('8/2kB4/8/2K5/8/3N4/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('d7', transform), to: transformSquare('a4', transform)}).san
    assert.equal(evaluateKnightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    const rejected = getChess(before)
    rejected.move({from: transformSquare('d7', transform), to: transformSquare('b5', transform)})
    assert.equal(evaluateKnightAndBishopSupportedDiagonal(rejected.fen()).size, 99)
  }
})
