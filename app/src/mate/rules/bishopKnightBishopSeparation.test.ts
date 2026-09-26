import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('all bishop clutter preferences and scoring fields are removed, across D4',()=>{
 assert.ok(!knightAndBishopWhiteRules.some(r=>r.id==='r4'));
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

test('without the crowding veto, Bc6 saves the attacked bishop beside the central king, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const start of [
  'Bk6/8/8/2NK4/8/8/8/8 w - - 0 1',
  '1k6/1B6/8/2NK4/8/8/8/8 w - - 0 1',
 ]){
  const fen=transformFen(start,t);
  const from=start.startsWith('B')?'a8':'b7';
  const move=getChess(fen).move({from:transformSquare(from,t),to:transformSquare('c6',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
 }
});
