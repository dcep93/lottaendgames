import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {explainMove} from './selection';
import {stableBishopProtectedSquares} from './bishopKnightStableProtection';

const start='8/8/1K6/1BN5/1k6/8/8/8 w - - 0 1';
test('r4 does not move a bishop back into the king crowding zone, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('3k4/1B6/2K5/8/8/8/8/7N w - - 2 2',t);
  const retreat=getChess(fen).move({from:transformSquare('b7',t),to:transformSquare('a8',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,retreat).bishopSeparationPenalty,1,t.name);
  const kingMoves=(['d5'] as const).map(to=>getChess(fen).move({from:transformSquare('c6',t),to:transformSquare(to,t)}).san);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen).sort(),kingMoves.sort(),t.name);
  // Moving closer from the original corner cannot earn an uncluttering bonus either.
  const original=transformFen('B3k3/8/2K5/8/8/8/8/7N w - - 0 1',t);
  const inward=getChess(original).move({from:transformSquare('a8',t),to:transformSquare('b7',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(original,inward).bishopSeparationPenalty,1,t.name);
  assert.ok(!getIdealKnightAndBishopWhiteMoves(original).includes(inward),t.name);
 }
});

test('r4 leaves a quiet interior bishop alone while r6 drifts the knight, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('7k/1B6/2K5/8/8/8/8/7N w - - 2 2',t);
  const moves=['c5','d6'].map(to=>getChess(fen).move({from:transformSquare('c6',t),to:transformSquare(to as 'c5'|'d6',t)}).san);
  const drift=getChess(fen).move({from:transformSquare('h1',t),to:transformSquare('f2',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[drift],t.name);
  for(const san of getChess(fen).moves()){
   const score=scoreKnightAndBishopWhiteMove(fen,san);
   assert.equal(score.bishopSeparationPenalty,0,`${t.name} ${san}`);
   assert.equal(score.bishopWhiteKingDistanceScore,0,`${t.name} ${san}`);
  }
  assert.ok(!stableBishopProtectedSquares(fen).includes(transformSquare('h1',t)),t.name);
  for(const san of moves){
   const board=getChess(fen);board.move(san);
   assert.ok(stableBishopProtectedSquares(board.fen()).includes(transformSquare('h1',t)),`${t.name} ${san}`);
  }
 }
});

test('r4 separates the bishop from a noncentral king, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen(start,t);
  const san=(to:'f1'|'e2'|'c6')=>getChess(fen).move({from:transformSquare('b5',t),to:transformSquare(to,t)}).san;
  const far=scoreKnightAndBishopWhiteMove(fen,san('f1'));
  const threeSteps=scoreKnightAndBishopWhiteMove(fen,san('e2'));
  const twoSteps=scoreKnightAndBishopWhiteMove(fen,san('c6'));
  assert.equal(far.bishopSeparationPenalty,0,t.name);
  assert.equal(threeSteps.bishopSeparationPenalty,0,t.name);
  assert.equal(twoSteps.bishopSeparationPenalty,1,t.name);
  assert.equal(far.bishopWhiteKingDistanceScore,-41,t.name);
  assert.ok(far.bishopWhiteKingDistanceScore<threeSteps.bishopWhiteKingDistanceScore,t.name);
  const rule=knightAndBishopWhiteRules.find(r=>r.id==='r4')!;
  assert.ok(rule.compare!(far,threeSteps)<0,t.name);
  assert.ok(rule.compare!(threeSteps,twoSteps)<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('f1')],t.name); // Separation now precedes r5.
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,san('f1'))?.id,'r4',t.name);
  const active=transformFen('8/8/1K6/1BN5/8/k7/8/8 w - - 0 1',t);
  const retreat=getChess(active).move({from:transformSquare('b5',t),to:transformSquare('f1',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(active),[retreat],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(active,getChess(active).moves()),knightAndBishopWhiteRules,retreat)?.id,'r4',t.name);
  const loaded=transformFen('8/8/NK6/1B6/8/k7/8/8 w - - 2 2',t);
  const loadedMove=getChess(loaded).move({from:transformSquare('b5',t),to:transformSquare('f1',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(loaded),[loadedMove],t.name);
  for(const move of getChess(fen).moves({verbose:true}).filter(m=>m.piece!=='b')){
   assert.equal(scoreKnightAndBishopWhiteMove(fen,move.san).bishopSeparationPenalty,1,`${t.name} ${move.san}`);
  }
 }
});

test('r4 unclutters beside a middle-16 king outside the central four, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const [start,from,to] of [
   ['8/8/8/2k5/2BN4/2K5/8/8 w - - 0 1','c4','g8'],
   ['8/8/2K5/1BN5/1k6/8/8/8 w - - 0 1','b5','f1'],
  ] as const){
   const fen=transformFen(start,t);
   const san=getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san],t.name);
   assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,san)?.id,'r4',t.name);
  }
 }
});

test('r4 clears a nearby edge bishop before the knight crowds its exit, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const start of [
   'B7/8/1K1k4/2N5/8/8/8/8 w - - 0 1',
  ]){
   const fen=transformFen(start,t);
   const retreat=getChess(fen).move({from:transformSquare('a8',t),to:transformSquare('h1',t)}).san;
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[retreat],t.name);
   assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,retreat)?.id,'r4',t.name);
  }
 }
});

test('r4 lets the king clear a diagonally adjacent bishop exit, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('BN1k4/1K6/8/8/8/8/8/8 w - - 2 2',t);
  const clear=getChess(fen).move({from:transformSquare('b7',t),to:transformSquare('a7',t)}).san;
  const back=getChess(fen).move({from:transformSquare('b8',t),to:transformSquare('c6',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,clear).bishopSeparationPenalty,0,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,back).bishopSeparationPenalty,1,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[clear],t.name);
  assert.ok(knightAndBishopWhiteRules.find(r=>r.id==='r4')!.compare!(scoreKnightAndBishopWhiteMove(fen,clear),scoreKnightAndBishopWhiteMove(fen,back))<0,t.name);
  // Among clearing king moves, r6 retains protection of Nb8.
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,clear)?.id,'r6',t.name);
 }
});

test('r4 does not credit an ordinary king move when the king is not blocking a bishop exit, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/8/8/1K6/1N6/2B3k1 w - - 0 1',t);
  // b3 is not diagonal-adjacent to c1, so leaving it clears no bishop exit.
  const move=getChess(fen).move({from:transformSquare('b3',t),to:transformSquare('a3',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move).bishopSeparationPenalty,1,t.name);
 }
});

test('r4 uses the starting king and bishop arrangement, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const fen of [
   '8/8/8/1BN5/1k1K4/8/8/8 w - - 0 1', // Adjacent king on central d4.
   '8/1K6/8/1BN5/1k6/8/8/8 w - - 0 1', // King outside middle 16, but not adjacent.
   'B7/8/4k3/1K6/2N5/8/8/8 w - - 0 1', // Edge bishop three steps from the king.
  ]){
   const f=transformFen(fen,t);
   for(const move of getChess(f).moves()){
    const s=scoreKnightAndBishopWhiteMove(f,move);
    assert.equal(s.bishopSeparationPenalty,0,`${t.name} ${move}`);
    assert.equal(s.bishopWhiteKingDistanceScore,0,`${t.name} ${move}`);
   }
  }
 }
});
