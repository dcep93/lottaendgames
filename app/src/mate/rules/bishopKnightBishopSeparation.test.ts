import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen} from '../chess';
import {knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('all bishop clutter preferences and scoring fields are removed, across D4',()=>{
 assert.ok(!knightAndBishopWhiteRules.some(r=>r.helpText.includes('clutter')));
 for(const t of SQUARE_TRANSFORMS)for(const start of [
  'B7/8/1K1k4/2N5/8/8/8/8 w - - 0 1',
  '8/8/1K6/1BN5/1k6/8/8/8 w - - 0 1',
  'Bk6/8/8/2NK4/8/8/8/8 w - - 0 1',
 ]){
  const fen=transformFen(start,t);
  for(const move of getChess(fen).moves()){
   const score=scoreKnightAndBishopWhiteMove(fen,move);
   for(const field of ['bishopSeparationPenalty','bishopWhiteKingDistanceScore','attackedBishopCrowdingPenalty'])assert.ok(!(field in score),`${t.name} ${field}`);
  }
 }
});
