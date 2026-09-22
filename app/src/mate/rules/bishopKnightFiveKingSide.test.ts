import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { evaluateKnightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight'

test('Nd3 five-diagonal support requires the White king strictly right of Black after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      // The loaded loop: same file, then White to Black's left.
      '8/2k5/2B5/2K5/8/3N4/8/8 b - - 1 1',
      '3k4/8/2B5/2K5/8/3N4/8/8 b - - 3 2',
      // The older nearby-kings Bd7 allowance cannot bypass the strict condition.
      '3k4/3B4/3K4/8/8/3N4/8/8 b - - 0 1',
    ]) assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1',
      // An earlier remote-a4 placement still qualifies when White is to the right.
      '8/8/1k6/3K4/B7/3N4/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('Nd3 requires a4 or king adjacency unless Bd7 faces an a-file Black king', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      // Loaded 1. Bd7: the king on c5 is two steps from the bishop.
      '8/1k1B4/8/2K5/8/3N4/8/8 b - - 1 1',
      '8/1k1B4/2K5/8/8/3N4/8/8 b - - 0 1', // Same-color Kc6, knight off support.

    ]) assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
    for (const fen of [
      '8/1k6/8/2K5/B7/3N4/8/8 b - - 0 1',

      '8/3B4/1k1K4/8/8/3N4/8/8 b - - 0 1',
      // Actual five knights retain their existing support classification.
      '8/1k1B4/8/2KN4/8/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})


test('the former second-move Bc6 declaration is now unsupported in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '46 24']) {
      const before = transformFen(`8/8/8/k2K4/B7/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('a4', transform), to: transformSquare('c6', transform)}).san
      assert.equal(evaluateKnightAndBishopSupportedDiagonal(board.fen()).size, 99)
      assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(move))
    }
    // The exclusion also applies to nearby placements.
    const nearby = transformFen('8/8/1kB5/3K4/8/3N4/8/8 b - - 0 1', transform)
    assert.notEqual(evaluateKnightAndBishopSupportedDiagonal(nearby).size, 5)
  }
})

test('Be8 with Nd3 and Black on the a-file supports the loaded placement, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['a5', 'a6', 'a7'] as const) {
      const board = getChess('4B3/8/8/2K5/8/3N4/8/7k b - - 42 23')
      board.remove('h1')
      board.put({type: 'k', color: 'b'}, black)
      assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 5)
    }
    const before = transformFen('8/8/k7/2K5/B7/3N4/8/8 w - - 2 2', transform)
    const board = getChess(before)
    board.move({from: transformSquare('a4', transform), to: transformSquare('e8', transform)})
    assert.equal(evaluateKnightAndBishopSupportedDiagonal(board.fen()).size, 5)
    for (const fen of [
      '4B3/8/1k6/2K5/8/3N4/8/8 b - - 0 1', // Off the a-file.
      '4B3/8/k7/2K5/2N5/8/8/8 b - - 0 1', // Knight off d3.
      '4B3/k7/8/8/8/3N4/6K1/8 b - - 0 1', // Universal king-distance limit.
      '8/8/k1B5/2K5/8/3N4/8/8 b - - 0 1', // Bc6 remains forbidden.
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99, fen)
  }
})


test('declared second-move Bd7 with Kd5 Nd3 versus Ka5 is supported and preferred', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '73 42']) {
      const before = transformFen(`8/8/8/k2K4/B7/3N4/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('a4', transform), to: transformSquare('d7', transform)}).san
      assert.deepEqual(evaluateKnightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 2})
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    for (const nearby of [
      '8/3B4/1k6/3K4/8/3N4/8/8 b - - 4 3', // Black's later b6 square is not the declaration.
      '8/3B4/8/k2K4/5N2/8/8/8 b - - 0 1',
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(nearby, transform)).size, 99)
  }
})


test('Bd7 with Nd3 waives king adjacency when Black is on the a-file, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['a5', 'a6', 'a7', 'a8'] as const) {
      const board = getChess('8/3B4/8/2K5/8/3N4/8/7k b - - 42 23')
      board.remove('h1')
      board.put({type: 'k', color: 'b'}, black)
      assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(board.fen(), transform)).size, 5, black)
    }
    const before = transformFen('8/3B4/3K4/k7/8/3N4/8/8 w - - 2 2', transform)
    const board = getChess(before)
    const move = board.move({from: transformSquare('d6', transform), to: transformSquare('c5', transform)}).san
    assert.equal(evaluateKnightAndBishopSupportedDiagonal(board.fen()).size, 5)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    for (const fen of [
      '8/3B4/1k6/2K5/8/3N4/8/8 b - - 0 1', // Off the a-file, no king adjacency.
      '8/3B4/k7/8/2K5/3N4/8/8 b - - 0 1', // Same-color king and knight off current support.
      'k7/3B4/8/8/2K5/3N4/8/8 b - - 0 1', // Kings more than three steps apart.
    ]) assert.equal(evaluateKnightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99, fen)
  }
})
