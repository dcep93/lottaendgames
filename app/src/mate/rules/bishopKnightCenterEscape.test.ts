import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r9.9 prefers center distance regardless of color; r20 only scores minor distance', () => {
  const r99 = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.9')!;
  const r20 = knightAndBishopWhiteRules.find(rule => rule.id === 'r20')!;
  assert.ok(r99.compare); assert.ok(r20.compare);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/5k2/8/3K4/8/8/1N6 w - - 0 1', transform);
    const score = (from: 'a8' | 'd4', to: 'h1' | 'f3' | 'c3' | 'e3' | 'd5') => {
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      return scoreKnightAndBishopWhiteMove(fen, san);
    };
    const far = score('a8', 'h1'), near = score('a8', 'f3');
    const offColorFar = score('d4', 'c3'), offColorNear = score('d4', 'e3'), sameColorCentral = score('d4', 'd5');
    assert.ok(r99.compare(offColorFar, sameColorCentral) > 0, transform.name);
    assert.ok(r99.compare(offColorNear, offColorFar) < 0, transform.name);
    assert.equal(r99.compare(far, sameColorCentral), 0, transform.name);
    assert.ok(r20.compare(far, near) < 0, transform.name);
    assert.equal(r20.compare(offColorFar, sameColorCentral), 0, transform.name);
    assert.equal(far.minorBlackDistanceScore, -Math.sqrt(29) - Math.sqrt(41));
  }
});
