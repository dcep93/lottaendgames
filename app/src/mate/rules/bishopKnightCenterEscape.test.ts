import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r7 breaks equal knight proximity by central proximity and Black king proximity; r20 scores minor distances from Black', () => {
  const r99 = knightAndBishopWhiteRules.find(rule => rule.id === 'r7')!;
  const r20 = knightAndBishopWhiteRules.find(rule => rule.id === 'r20')!;
  assert.ok(r99.compare); assert.ok(r20.compare);
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/5k2/8/3K4/8/8/1N6 w - - 0 1', transform);
    const score = (from: 'a8' | 'd4', to: 'h1' | 'f3' | 'c3' | 'e3' | 'd5') => {
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      return {...scoreKnightAndBishopWhiteMove(fen, san), kingKnightDistanceScore: 0};
    };
    const far = score('a8', 'h1'), near = score('a8', 'f3');
    const offColorFar = score('d4', 'c3'), offColorNear = score('d4', 'e3'), sameColorCentral = score('d4', 'd5');
    assert.ok(r99.compare(offColorFar, sameColorCentral) > 0, transform.name);
    assert.ok(r99.compare(offColorNear, offColorFar) < 0, transform.name);
    assert.ok(r99.compare(far, sameColorCentral) > 0, transform.name);
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


test('r7 puts central-square proximity ahead of Black king proximity across D4', () => {
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


test('r7 resolves equal central distance by approaching Black across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('5k2/8/6B1/6K1/8/8/1N6/8 w - - 0 1', t);
    const move = (to: 'f4' | 'f5' | 'f6') => getChess(fen).move({from: transformSquare('g5', t), to: transformSquare(to, t)}).san;
    const rule = knightAndBishopWhiteRules.find(r => r.id === 'r7')!;
    const f4 = scoreKnightAndBishopWhiteMove(fen, move('f4')), f5 = scoreKnightAndBishopWhiteMove(fen, move('f5')), f6 = scoreKnightAndBishopWhiteMove(fen, move('f6'));
    assert.equal(f4.kingCenterProximityScore, 1);
    assert.equal(f5.kingCenterProximityScore, 1);
    assert.equal(f6.kingCenterProximityScore, 1);
    assert.ok(rule.compare!(f4, f5) > 0);
    assert.ok(rule.compare!(f4, f6) < 0);
    // Euclidean central proximity breaks the step tie before Black king proximity.
    assert.ok(rule.compare!(f5, f6) < 0);
  }
});


test('r20 excludes minors defended by either the king or the other minor across D4', () => {
  const cases = [
    // After Kh2, Bc6 defends Nd5; only the bishop contributes.
    ['8/8/2B5/3N4/8/1k6/8/7K w - - 0 1', 'h1', 'h2', -Math.sqrt(10)],
    // After Kh2, Nb4 defends Bc6; only the knight contributes.
    ['8/8/2B5/8/1N6/8/3k4/7K w - - 0 1', 'h1', 'h2', -Math.sqrt(8)],
    // Kd5 protects both minor pieces.
    ['7k/8/8/8/2BKN3/8/8/8 w - - 0 1', 'd4', 'd5', -0],
  ] as const;
  for (const [start, from, to, expected] of cases) for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t);
    const san = getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).minorBlackDistanceScore, expected, t.name);
  }
});


test('r20 keeps initially undefended minors in the distance score even after gaining defense across D4', () => {
 const r20 = knightAndBishopWhiteRules.find(r => r.id === 'r20')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('K7/8/8/7B/2k5/2N5/8/8 w - - 0 1', t);
  const san = (to: 'd1' | 'b1' | 'e2') => getChess(fen).move({from: transformSquare('c3', t), to: transformSquare(to, t)}).san;
  const protectedRetreat = scoreKnightAndBishopWhiteMove(fen, san('d1'));
  const distant = scoreKnightAndBishopWhiteMove(fen, san('b1'));
  const protectedCentral = scoreKnightAndBishopWhiteMove(fen, san('e2'));
  assert.equal(protectedRetreat.unprotectedMinorCount, 2);
  assert.equal(distant.unprotectedMinorCount, 2);
  assert.equal(protectedCentral.unprotectedMinorCount, 2);
  assert.ok(r20.compare!(protectedRetreat, distant) < 0);
  assert.ok(r20.compare!(protectedCentral, protectedRetreat) > 0);
 }
});

test('r20 does not count an edge bishop protecting an adjacent knight as stable, across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('B7/1N6/8/8/4k3/8/8/7K w - - 0 1', t);
  const san = getChess(fen).move({from: transformSquare('h1', t), to: transformSquare('h2', t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen, san).unprotectedMinorCount, 2, t.name);
 }
});

test('r20 keeps pre-move defense scoring with r4 inactive for Kd3, across D4',()=>{
 const r20=knightAndBishopWhiteRules.find(r=>r.id==='r20')!;
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('4B3/8/8/2k5/8/2NK4/8/8 w - - 0 1',t);
  const san=(to:'h5'|'b5')=>getChess(fen).move({from:transformSquare('e8',t),to:transformSquare(to,t)}).san;
  const far=scoreKnightAndBishopWhiteMove(fen,san('h5'));
  const newlyDefended=scoreKnightAndBishopWhiteMove(fen,san('b5'));
  assert.equal(far.unprotectedMinorCount,1,t.name);
  assert.equal(newlyDefended.unprotectedMinorCount,1,t.name);
  assert.equal(far.minorBlackDistanceScore,-5,t.name);
  assert.equal(newlyDefended.minorBlackDistanceScore,-1,t.name);
  assert.ok(r20.compare!(far,newlyDefended)<0,t.name);
  assert.equal(far.startsWithCentralKingAndMiddle16Knight,false,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('h5')],t.name);
 }
});

test('r20 keeps an initially defended bishop excluded even when its move leaves king protection',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/1k6/8/4B3/2NK4/8/8 w - - 0 1',t);
  const move=getChess(fen).move({from:transformSquare('e4',t),to:transformSquare('h1',t)}).san;
  const score=scoreKnightAndBishopWhiteMove(fen,move);
  assert.equal(score.unprotectedMinorCount,0,t.name);
  assert.equal(score.minorBlackDistanceScore,-0,t.name);
 }
});


test('r7 approaches Black after knight and central proximity tie, across D4',()=>{
 const rule=knightAndBishopWhiteRules.find(r=>r.id==='r7')!;
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/5K2/3kN3/8/6B1/8 w - - 4 3',t);
  const move=(to:'f4'|'f6')=>getChess(fen).move({from:transformSquare('f5',t),to:transformSquare(to,t)}).san;
  const near=scoreKnightAndBishopWhiteMove(fen,move('f4'));
  const stay=scoreKnightAndBishopWhiteMove(fen,getChess(fen).move({from:transformSquare('g2',t),to:transformSquare('h1',t)}).san);
  assert.equal(near.kingKnightDistanceScore,stay.kingKnightDistanceScore,t.name);
  assert.equal(near.kingCenterEuclideanScore,stay.kingCenterEuclideanScore,t.name);
  assert.ok(near.kingBlackDistanceSquared<stay.kingBlackDistanceSquared,t.name);
  assert.ok(rule.compare!(near,stay)<0,t.name);
 }
});
