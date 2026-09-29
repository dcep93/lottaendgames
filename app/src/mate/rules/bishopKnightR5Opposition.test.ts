import assert from 'node:assert/strict';
import test from 'node:test';
import {SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {knightAndBishopR5OppositionMoves} from './bishopKnightR5Opposition';


test('r5 still advances when the attacked bishop keeps knight protection, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/8/8/1k6/1B6/2KN4 w - - 0 1',t);
  assert.deepEqual(knightAndBishopR5OppositionMoves(fen),[transformSquare('c1',t)+transformSquare('d2',t)],t.name);
 }
});

test('r5 opposition step translates and rejects outward opposition or a bishop-blocked king destination',()=>{
 const cases=[
  {fen:'4B3/8/8/8/2k5/1N6/2K5/8 w - - 0 1',moves:['b3d2']},
  {fen:'4B3/8/8/8/2K5/1N6/2k5/8 w - - 0 1'},
  {fen:'8/8/8/8/8/1k6/3B4/2KN4 w - - 0 1'},
 ] as const;
 for(const c of cases)for(const t of SQUARE_TRANSFORMS){
  const expected='moves' in c?c.moves.map(m=>transformSquare(m.slice(0,2) as 'b3',t)+transformSquare(m.slice(2) as 'd2',t)):undefined;
  assert.deepEqual(knightAndBishopR5OppositionMoves(transformFen(c.fen,t)),expected,t.name);
 }
});
