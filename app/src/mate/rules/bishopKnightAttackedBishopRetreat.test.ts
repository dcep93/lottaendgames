import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {explainMove} from './selection';

test('r6 stable defense outranks r6.5 retreat distance across D4', () => {
 for(const t of SQUARE_TRANSFORMS) {
  const fen=transformFen('7K/8/8/8/Bk6/8/8/3N4 w - - 0 1',t);
  const move=getChess(fen).move({from:transformSquare('a4',t),to:transformSquare('c2',t)}).san;
  const retreat=getChess(fen).move({from:transformSquare('a4',t),to:transformSquare('e8',t)}).san;
  const score=scoreKnightAndBishopWhiteMove(fen,move), far=scoreKnightAndBishopWhiteMove(fen,retreat);
  assert.ok(knightAndBishopWhiteRules.find(r=>r.id==='r6.5')!.compare!(far,score)<0);
  assert.equal(score.knightStableBishopProtectionPenalty,0);
  assert.equal(far.knightStableBishopProtectionPenalty,1);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,move)?.id,'r6',t.name);
 }
});

test('r6.5 does not activate for a bishop Black is not attacking across D4', () => {
 const rule=knightAndBishopWhiteRules.find(r=>r.id==='r6.5')!;
 for(const t of SQUARE_TRANSFORMS) {
  const fen=transformFen('7K/8/8/4k3/B7/8/8/3N4 w - - 0 1',t);
  const scores=getChess(fen).moves().map(m=>scoreKnightAndBishopWhiteMove(fen,m));
  for(const score of scores)assert.equal(rule.compare!(score,scores[0]!),0,t.name);
 }
});

test('r6.5 stays neutral when the attacked bishop already has king protection, across D4', () => {
 const rule=knightAndBishopWhiteRules.find(r=>r.id==='r6.5')!;
 for(const start of [
  '8/8/8/8/3kBK2/4N3/8/8 w - - 0 1',
  '8/8/8/8/8/2kB4/4K3/N7 w - - 0 1',
 ])for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen(start,t);
  const scores=getChess(fen).moves().map(m=>scoreKnightAndBishopWhiteMove(fen,m));
  assert.ok(scores.length>1);
  for(const score of scores){
   assert.equal(score.attackedBishopDistanceScore,0,t.name);
   assert.equal(rule.compare!(score,scores[0]!),0,t.name);
  }
 }
});
