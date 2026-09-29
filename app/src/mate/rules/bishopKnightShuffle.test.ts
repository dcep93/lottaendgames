import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {knightAndBishopShuffleTargets} from './bishopKnightShuffle';

test('r8 also recognizes direct opposition and excludes ineligible geometry, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  assert.equal(knightAndBishopShuffleTargets(transformFen('8/8/8/4k3/B3N3/4K3/8/8 w - - 0 1',t)).length,2);
  for(const fen of [
   '8/8/8/3k4/B1N5/4K3/8/8 w - - 0 1', // Knight outside the gap.
   '8/8/5k2/8/B3N3/4K3/8/8 w - - 0 1', // Kings farther apart.
   '8/8/3k4/3N4/B2K4/8/8/8 w - - 0 1', // White more central.
   '8/8/4k3/4N3/B3K3/8/8/8 w - - 0 1', // Equal midpoint distances.
  ])assert.deepEqual(knightAndBishopShuffleTargets(transformFen(fen,t)),[],t.name);
 }
});

test('r8 respects the knight blocking bishop control, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/3k4/4N3/4K3/6B1/8 w - - 0 1',t);
  const move=getChess(fen).move({from:transformSquare('g2',t),to:transformSquare('f3',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move).bishopShuffleControlPenalty,1,t.name);
 }
});
