import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {explainMove} from './selection';

const start='8/8/1K6/1BN5/1k6/8/8/8 w - - 0 1';
test('r4 separates the bishop from a king outside the middle 16, across D4',()=>{
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

test('r4 uses the starting king and bishop arrangement, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const fen of [
   '8/8/2K5/1BN5/1k6/8/8/8 w - - 0 1', // Adjacent king on the c6 boundary of middle 16.
   '8/1K6/8/1BN5/1k6/8/8/8 w - - 0 1', // King outside middle 16, but not adjacent.
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
