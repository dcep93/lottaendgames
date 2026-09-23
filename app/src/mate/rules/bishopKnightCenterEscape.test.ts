import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r9.9 scores center distance without r6; r20 scores minor distances to both kings', () => {
  assert.ok(!knightAndBishopWhiteRules.some(rule => rule.id === 'r6'));
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
    assert.equal('kingBishopColorPenalty' in sameColorCentral, false);
    assert.ok(r20.compare(far, near) < 0, transform.name);
    assert.ok(r20.compare(offColorFar, sameColorCentral) < 0, transform.name);
    assert.equal(far.minorBlackDistanceScore, -Math.sqrt(29) - Math.sqrt(41));
  }
});


test('r20 breaks equal Black-distance ties toward White’s king across D4', () => {
  const r20 = knightAndBishopWhiteRules.find(rule => rule.id === 'r20')!;
  assert.ok(r20.compare);
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/4K3/3B4/Nk6/8/8/8 w - - 2 2', t);
    const move = (to: 'b6' | 'b2') => getChess(fen).move({from: transformSquare('a4', t), to: transformSquare(to, t)}).san;
    const near = scoreKnightAndBishopWhiteMove(fen, move('b6'));
    const far = scoreKnightAndBishopWhiteMove(fen, move('b2'));
    assert.equal(near.minorBlackDistanceScore, far.minorBlackDistanceScore, t.name);
    assert.equal(near.minorWhiteDistanceScore, Math.sqrt(2) + 3, t.name);
    assert.equal(far.minorWhiteDistanceScore, Math.sqrt(2) + 5, t.name);
    assert.ok(r20.compare(near, far) < 0, t.name);
    // Without r9.98, r17 can retain Na4 and protect it with Bc6.
    const bishopDefense = getChess(fen).move({from: transformSquare('d5', t), to: transformSquare('c6', t)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [bishopDefense], t.name);
  }
});
