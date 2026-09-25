import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r7 ranks central king Euclidean distance, then opposite color; r20 scores minor distances from Black', () => {
  const r99 = knightAndBishopWhiteRules.find(rule => rule.id === 'r7')!;
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
    assert.ok(r99.compare(far, sameColorCentral) < 0, transform.name);
    assert.equal(sameColorCentral.kingBishopColorPenalty, 1);
    assert.equal(offColorNear.kingBishopColorPenalty, 0);
    assert.ok(!knightAndBishopWhiteRules.some(r => r.id === 'r19'));
    assert.ok(r20.compare(far, near) < 0, transform.name);
    assert.equal(r20.compare(offColorFar, sameColorCentral), 0, transform.name);
    assert.equal(far.minorBlackDistanceScore, -Math.sqrt(29) - Math.sqrt(41));
  }
});


test('r20 breaks equal Black-distance ties by minor Euclidean proximity to the center across D4', () => {
  const r20 = knightAndBishopWhiteRules.find(rule => rule.id === 'r20')!;
  assert.ok(r20.compare);
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/4K3/3B4/Nk6/8/8/8 w - - 2 2', t);
    const move = (to: 'b6' | 'b2') => getChess(fen).move({from: transformSquare('a4', t), to: transformSquare(to, t)}).san;
    const near = scoreKnightAndBishopWhiteMove(fen, move('b6'));
    const far = scoreKnightAndBishopWhiteMove(fen, move('b2'));
    assert.equal(near.minorBlackDistanceScore, far.minorBlackDistanceScore, t.name);
    assert.ok(near.minorCenterDistanceScore < far.minorCenterDistanceScore, t.name);
    assert.ok(r20.compare(near, far) < 0, t.name);
  }
});


test('r7 puts central-square proximity ahead of color across D4', () => {
  const compare = knightAndBishopWhiteRules.find(rule => rule.id === 'r7')!.compare!;
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/7k/8/3BK3/2N5/8/8/8 w - - 6 4', t);
    const score = (to: 'd4' | 'e4' | 'f4' | 'f6') => scoreKnightAndBishopWhiteMove(fen,
      getChess(fen).move({from: transformSquare('e5', t), to: transformSquare(to, t)}).san);
    const d4 = score('d4'), e4 = score('e4'), f4 = score('f4'), f6 = score('f6');
    assert.equal(d4.kingCenterProximityScore, 0, t.name);
    assert.equal(e4.kingCenterProximityScore, 0, t.name);
    assert.equal(f4.kingCenterProximityScore, 1, t.name);
    assert.equal(f6.kingCenterProximityScore, 1, t.name);
    assert.ok(compare(d4, e4) < 0, t.name);
    assert.ok(compare(e4, f4) < 0, t.name);
    assert.equal(f4.kingCenterEuclideanScore, 1);
    assert.equal(f6.kingCenterEuclideanScore, 2);
    assert.ok(compare(f4, f6) < 0, t.name);
    // The same-color central square wins over an opposite-color square one step out.
    assert.ok(compare(e4, f4) < 0, t.name);
  }
});


test('r7 prefers inward diagonal king steps in the loaded loop across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('5k2/8/6B1/6K1/8/8/1N6/8 w - - 0 1', t);
    const move = (to: 'f4' | 'f5' | 'f6') => getChess(fen).move({from: transformSquare('g5', t), to: transformSquare(to, t)}).san;
    const rule = knightAndBishopWhiteRules.find(r => r.id === 'r7')!;
    const f4 = scoreKnightAndBishopWhiteMove(fen, move('f4')), f5 = scoreKnightAndBishopWhiteMove(fen, move('f5')), f6 = scoreKnightAndBishopWhiteMove(fen, move('f6'));
    assert.equal(f4.kingCenterProximityScore, 1);
    assert.equal(f5.kingCenterProximityScore, 1);
    assert.equal(f6.kingCenterProximityScore, 1);
    assert.ok(rule.compare!(f4, f5) < 0);
    assert.ok(rule.compare!(f4, f6) < 0);
    // Euclidean proximity breaks the step tie before opposite color does.
    assert.ok(rule.compare!(f5, f6) < 0);
  }
});
