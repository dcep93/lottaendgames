import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight';
import { knightAndBishopRelativeKnightMove } from './bishopKnightRelativeKnight';

test('r9.1 prescribes Nd2 in the supplied position across all board symmetries', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/8/8/5k2/5N2/4K3/8 w - - 0 1', t);
    const from = transformSquare('f3', t), to = transformSquare('d2', t);
    assert.equal(knightAndBishopRelativeKnightMove(fen), from + to);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [getChess(fen).move({from, to}).san], t.name);
  }
});

test('r9.1 is translation invariant, bishop independent, and requires a legal destination', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const fen of ['8/8/B7/8/4k3/4N3/3K4/8 w - - 0 1', 'B7/8/8/8/4k3/4N3/3K4/8 w - - 0 1']) {
      assert.equal(knightAndBishopRelativeKnightMove(transformFen(fen, t)), transformSquare('e3', t) + transformSquare('c2', t));
    }
    for (const fen of [
      '8/8/8/8/5k2/5N2/3BK3/8 w - - 0 1', // Occupied destination.
      'B7/8/8/8/5k2/4N3/4K3/8 w - - 0 1', // Different knight relation.
      'B7/8/8/8/5k2/5N2/3K4/8 w - - 0 1', // Different king relation.
    ]) assert.equal(knightAndBishopRelativeKnightMove(transformFen(fen, t)), undefined);
  }
});
