import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { blackKingMoatSides, knightDistanceFromBlackMoatSide } from './bishopKnightKingMoat';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('Black-side moat distance uses a region beyond White and extends to distant kings, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['e6', 'e3'] as const) {
      const sides = blackKingMoatSides(transformSquare('f8', transform), transformSquare(black, transform));
      for (const [knight, distance] of [['e8', 2], ['g7', 1], ['f6', 0], ['a1', 0]] as const)
        assert.equal(knightDistanceFromBlackMoatSide(transformSquare(knight, transform), sides), distance);
    }
    const diagonal = blackKingMoatSides(transformSquare('f8', transform), transformSquare('b4', transform));
    assert.equal(diagonal.length, 2);
    assert.equal(knightDistanceFromBlackMoatSide(transformSquare('h8', transform), diagonal), 2);
    assert.equal(knightDistanceFromBlackMoatSide(transformSquare('e8', transform), diagonal), 1);
    assert.equal(knightDistanceFromBlackMoatSide(transformSquare('c8', transform), diagonal), 0);
  }
});

test('r15 sends the nearby Ng7 behind the starting moat with Ne8 in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('B4K2/6N1/5k2/8/8/8/8/8 w - - 0 1', transform);
    const ne8 = getChess(fen).move({from: transformSquare('g7', transform), to: transformSquare('e8', transform)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ne8).knightBlackMoatDistanceScore, -2);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [ne8], transform.name);
  }
});

test('r15 freezes the source moat and its two-step activation before White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to, expected] of [
      // Moving White's king toward Black must not shift the moat to improve the score.
      ['B4K2/6N1/5k2/8/8/8/8/8 w - - 0 1', 'f8', 'e8', -1],
      // The loaded Ne8 is exactly two steps from Black; returning toward Black scores worse.
      ['B3NK2/8/4k3/8/8/8/8/8 w - - 0 1', 'e8', 'g7', -1],
      ['B3NK2/8/4k3/8/8/8/8/8 w - - 0 1', 'f8', 'g8', -2],
      // Initially distant knight: approaching does not activate r15 for this move.
      ['B4K2/8/5k2/8/8/8/N7/8 w - - 0 1', 'a2', 'c3', 0],
    ] as const) {
      const source = transformFen(fen, transform);
      const san = getChess(source).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(source, san).knightBlackMoatDistanceScore, expected);
    }
  }
});
