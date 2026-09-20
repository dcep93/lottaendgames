import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('final center preference breaks both phases of the dominant knight shuttle in every orientation', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to] of [
      ['2N5/2k5/8/8/3KB3/8/8/8 w - - 0 1', 'c8', 'e7'],
      ['8/N7/1k6/8/3KB3/8/8/8 w - - 2 2', 'a7', 'c6'],
      ['8/8/2k5/3N4/3KB3/8/8/8 w - - 0 1', 'd5', 'e3'],
    ] as const) {
      const fen = transformFen(source, transform);
      const move = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)});
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
    }
  }
});

test('next-attack preference still outranks a closer knight', () => {
  const fen = '8/7N/3k4/8/3KB3/8/8/8 w - - 0 1';
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ['Ng5']);
});

test('equally central knight destinations retain an equal final score', () => {
  const fen = '7k/8/8/8/3N4/8/8/KB6 w - - 0 1';
  assert.equal(scoreKnightAndBishopWhiteMove(fen, 'Ne6').knightCenterProximityScore,
    scoreKnightAndBishopWhiteMove(fen, 'Nf5').knightCenterProximityScore);
});
