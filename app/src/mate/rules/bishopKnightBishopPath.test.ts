import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {bishopCentralPathDistances} from './bishopKnightBishopPath';
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r6 selects the exact Ba8 declaration across D4, independent of move counters', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/3B4/3k4/8/5N2/4K3 w - - 2 2', transform);
    const move = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('a8', transform)});
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move.san]);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move.san).bishopCentralPathDistance, 0);
  }
});

test('r6 Ba8 declaration does not generalize to a different Black king or White formation', () => {
  for (const fen of [
    '8/8/8/3B4/4k3/8/5N2/4K3 w - - 0 1',
    '8/8/8/3B4/3k4/8/5N2/5K2 w - - 0 1',
  ]) for (const transform of SQUARE_TRANSFORMS) {
    assert.notDeepEqual([...bishopCentralPathDistances(transformFen(fen, transform))], [[transformSquare('a8', transform), 0]]);
  }
});
