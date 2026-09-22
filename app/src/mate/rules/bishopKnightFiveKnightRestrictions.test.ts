import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('five-knight support rejects same-color kings and a4 bishops, including all reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, expected] of [
      ['8/8/k1K5/1B1N4/8/8/8/8 b - - 1 1', 99], // Loaded Bb5+: Kc6 is bishop-colored.
      ['8/8/k7/2KN4/B7/8/8/8 b - - 1 1', 99], // Kc5 is opposite-colored, but Ba4 still fails.
      ['8/8/k1K5/3N4/B7/8/8/8 b - - 1 1', 99],
      ['8/8/k7/1BKN4/8/8/8/8 b - - 1 1', 5], // Opposite-color king, Bb5.
      ['8/8/k1B5/3N4/3K4/8/8/8 b - - 1 1', 99], // Other support conditions still apply to opposite-color kings.
      ['8/8/1k1K4/8/B7/3N4/8/8 b - - 1 1', 5], // Nd3 remains governed by its own rules.
      ['k7/8/B1K5/3N4/8/8/8/8 b - - 1 1', 3], // Nd5 previous-stage three support unchanged.
    ] as const) {
      for (const counters of ['1 1', '73 42']) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen.replace('1 1', counters), transform)).size, expected, fen + transform.name)
    }
    const fen = transformFen('8/8/k1K5/3N4/B7/8/8/8 w - - 0 1', transform)
    const bb5 = getChess(fen).move({from:transformSquare('a4',transform),to:transformSquare('b5',transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen,bb5).supportedDiagonalSizeScore,99)
  }
})


test('five-knight support permits three steps and rejects four after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '72 42']) {
      const before = transformFen(`8/k3K3/8/1B1N4/8/8/8/8 w - - ${counters}`, transform)
      const move = getChess(before).move({from: transformSquare('e7', transform), to: transformSquare('d6', transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
    }
    for (const [fen, expected] of [
      ['8/k7/3K4/1B1N4/8/8/8/8 b - - 1 1', 5], // Exactly three steps is eligible.
      ['8/1k6/3K4/1B1N4/8/8/8/8 b - - 1 1', 5], // Exactly two steps remains eligible.
      ['8/8/2B5/k2N4/3K4/8/8/8 b - - 1 1', 99], // Bc6 overrides the older declared placement.
      ['8/k3K3/8/1B1N4/8/8/8/8 b - - 1 1', 99], // Four steps still fails.
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, expected, fen)
  }
})


test('declared Kd7 with Bb5 Nd5 against Kb7 supports five despite the king color', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '72 42']) {
      const before = transformFen(`8/1k6/3K4/1B1N4/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('d6', transform), to: transformSquare('d7', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 0})
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 5)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    for (const fen of [
      'k7/3K4/8/1B1N4/8/8/8/8 b - - 1 1', // Different Black placement; kings three steps apart.
      '1k6/3K4/8/1B1N4/8/8/8/8 b - - 1 1', // Different Black placement even within two steps.
      '8/1k1K4/2B5/3N4/8/8/8/8 b - - 1 1', // Different bishop.
      '8/1k1K4/8/1B6/8/3N4/8/8 b - - 1 1', // Different knight.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 99, fen)
  }
})


test('Bb5 and Nd5 require bishop adjacency when White king is left of Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '72 42']) {
      const before = transformFen(`2k5/8/1K6/1B1N4/8/8/8/8 w - - ${counters}`, transform)
      for (const to of ['a7'] as const) {
        const board = getChess(before)
        const move = board.move({from: transformSquare('b6', transform), to: transformSquare(to, transform)}).san
        // Ka7 is left and remote from Bb5.
        assert.equal(knightAndBishopSupportedDiagonal(board.fen()).size, 99)
        assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
      }
    }
    for (const fen of [
      '2k5/8/1K6/1B1N4/8/8/8/8 b - - 1 1', // Left but bishop-adjacent.
      '2k5/4K3/8/1B1N4/8/8/8/8 b - - 1 1', // Right and within two king steps; no adjacency required.
      '8/1k1K4/8/1B1N4/8/8/8/8 b - - 1 1', // The declared Kd7 exception still works.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5, fen)
  }
})


test('loaded Nd5 cannot restore support while the bishop remains on c6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '72 42']) {
      const before = transformFen(`1k6/8/2B5/2K5/1N6/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('b4', transform), to: transformSquare('d5', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 99, knight: 99})
      assert.ok(!getIdealKnightAndBishopWhiteMoves(before).includes(move))
    }
  }
})
