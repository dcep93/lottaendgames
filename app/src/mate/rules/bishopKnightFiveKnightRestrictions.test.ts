import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { scoreKnightAndBishopWhiteMove } from './bishopKnight'

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


test('five-knight support requires kings within two steps after White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['0 1', '72 42']) {
      const before = transformFen(`8/k3K3/8/1B1N4/8/8/8/8 w - - ${counters}`, transform)
      const move = getChess(before).move({from: transformSquare('e7', transform), to: transformSquare('d6', transform)}).san
      assert.equal(scoreKnightAndBishopWhiteMove(before, move).supportedDiagonalSizeScore, 99)
    }
    for (const [fen, expected] of [
      ['8/k7/3K4/1B1N4/8/8/8/8 b - - 1 1', 99], // Three steps, even though king is opposite-colored.
      ['8/1k6/3K4/1B1N4/8/8/8/8 b - - 1 1', 5], // Exactly two steps remains eligible.
      ['8/8/2B5/k2N4/3K4/8/8/8 b - - 1 1', 99], // Older declared placement also loses support at three steps.
    ] as const) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, expected, fen)
  }
})
