import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopSixPointNineMove } from './bishopKnightSixPointNine';

test('retained 6.9 pattern helper takes opposition in every D4 orientation, independent of the knight', () => {
  for (const knightRank of ['6N1', 'N7', '4N3']) {
    for (const t of SQUARE_TRANSFORMS) {
      const fen = transformFen(`8/8/1kB5/3K4/8/8/8/${knightRank} w - - 2 2`, t);
      const from = transformSquare('d5', t), to = transformSquare('d6', t);
      assert.equal(knightAndBishopSixPointNineMove(fen), from + to);
      assert.ok(getChess(fen).move({ from, to }));
    }
  }
});

test('retained 6.9 pattern helper requires the corner-relative arrangement and a legal move', () => {
  for (const fen of [
    '8/8/1kBN4/3K4/8/8/8/8 w - - 0 1', // Destination occupied.
    '8/8/1kB5/4K3/8/8/8/6N1 w - - 0 1', // King not adjacent to bishop.
    '8/8/2kB4/4K3/8/8/8/6N1 w - - 0 1', // Translation is not a long-diagonal corner pattern.
    '8/8/1kB5/3K4/8/8/8/6N1 b - - 0 1',
  ]) assert.equal(knightAndBishopSixPointNineMove(fen), undefined, fen);
});
