import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r5.5 rejects bishop-only defense of an attacked knight, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, penalty] of [
      ['KB6/8/2k5/3N4/8/8/8/8 w - - 0 1', 1],
      ['1B1K4/8/2k5/3N4/8/8/8/8 w - - 0 1', 0],
      ['KB6/8/8/k2N4/8/8/8/8 w - - 0 1', 0],
      ['K6B/8/2k5/3N4/8/8/8/8 w - - 0 1', 0],
    ] as const) {
      const fen = transformFen(start, t);
      const move = getChess(fen).move({from: transformSquare('d5', t), to: transformSquare('c7', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).attackedKnightBishopOnlyPenalty, penalty, t.name);
      if (penalty) assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move), t.name);
    }
  }
});
