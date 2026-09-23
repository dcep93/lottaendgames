import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r20 prioritizes king centrality, then summed minor distance, across all symmetries', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r20')!;
  assert.ok(rule.compare);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/5k2/8/3K4/8/8/1N6 w - - 0 1', transform);
    const score = (from: 'a8' | 'd4', to: 'h1' | 'f3' | 'c3') => {
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      return scoreKnightAndBishopWhiteMove(fen, san);
    };
    const far = score('a8', 'h1'), near = score('a8', 'f3'), kingAway = score('d4', 'c3');
    assert.ok(rule.compare(far, near) < 0, transform.name);
    assert.ok(rule.compare(near, kingAway) < 0, transform.name);
    assert.equal(far.minorBlackDistanceScore, -Math.sqrt(29) - Math.sqrt(41));
  }
});
