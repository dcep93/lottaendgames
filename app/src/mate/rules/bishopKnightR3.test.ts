import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {knightAndBishopR3Target} from './bishopKnightR3';
import {getIdealKnightAndBishopWhiteMoves,scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r3 switches central squares beside the knight, independent of bishop location, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const start of [
  '8/8/B4k2/8/3NK3/8/8/8 w - - 0 1',
  'B7/8/5k2/8/3NK3/8/8/8 w - - 0 1',
  '8/8/5k2/3K4/3N4/8/8/7B w - - 0 1',
 ]){
  const reverse=start.includes('3K4'),from=reverse?'d5':'e4',to=reverse?'e4':'d5';
  const fen=transformFen(start,t);
  assert.equal(knightAndBishopR3Target(fen),transformSquare(to,t),t.name);
  const move=getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
 }
});

test('r3 requires the exact corner geometry, central orthogonal adjacency and opposite bishop color',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const start of [
  '8/4k3/B7/8/3NK3/8/8/8 w - - 0 1', // Not two diagonal steps from corner.
  '8/8/5k2/8/3NK3/8/8/B7 w - - 0 1', // Same color bishop.
  '8/8/B4k2/3K4/4N3/8/8/8 w - - 0 1', // Diagonal king/knight adjacency.
  '8/8/B4k2/2K5/3N4/8/8/8 w - - 0 1', // Noncentral king.
  '8/8/B4k2/8/2N1K3/8/8/8 w - - 0 1', // Noncentral knight.
  '8/8/B4k2/8/3KN3/8/8/8 w - - 0 1', // Knight not two diagonal steps from Black.
  '8/8/5k2/3B4/3NK3/8/8/8 w - - 0 1', // Destination occupied by bishop.
 ])assert.equal(knightAndBishopR3Target(transformFen(start,t)),undefined,t.name+' '+start);
});

test('r3 matches the loaded line before Kd5, but not after Black Ke7',()=>{
 const ch=getChess('8/8/B4k2/8/3NK3/8/8/8 w - - 0 1');
 assert.equal(scoreKnightAndBishopWhiteMove(ch.fen(),'Kd5').r3StepPenalty,0);
 assert.equal(scoreKnightAndBishopWhiteMove(ch.fen(),'Ke3').r3StepPenalty,1);
 ch.move('Kd5');ch.move('Ke7');
 assert.equal(knightAndBishopR3Target(ch.fen()),undefined);
});
