import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare, squareFromCoords} from '../chess';
import {knightAndBishopR5Move} from './bishopKnightR5';

const example='B7/8/8/8/8/2k5/2N5/3K4 w - - 0 1';

test('r5 geometry is independent of bishop placement except an occupied landing square',()=>{
 for(let i=0;i<64;i++){
  const square=squareFromCoords(i%8,i>>3)!;
  if(['c2','c3','d1'].includes(square))continue;
  const board=getChess(example);board.remove('a8');board.put({type:'b',color:'w'},square);
  assert.equal(knightAndBishopR5Move(board.fen()),square==='e1'?undefined:'c2e1',square);
 }
});

test('r5 applies to translated geometry, but rejects missing geometric conditions across D4',()=>{
 const cases=[
  {fen:'B7/8/8/8/2k5/2N5/3K4/8 w - - 0 1',move:['c3','e2']},
  {fen:'B7/8/8/8/3K4/2N5/2k5/8 w - - 0 1'}, // Black less central.
  {fen:'B7/8/8/8/8/2k5/3N4/3K4 w - - 0 1'}, // King/knight not diagonal.
  {fen:'B7/8/8/8/8/1k6/2N5/3K4 w - - 0 1'}, // Black diagonally adjacent.
  {fen:'B7/8/8/8/8/8/1kN5/3K4 w - - 0 1'}, // Hop would land off-board.
 ] as const;
 for(const c of cases)for(const t of SQUARE_TRANSFORMS){
  const expected='move' in c?transformSquare(c.move[0],t)+transformSquare(c.move[1],t):undefined;
  assert.equal(knightAndBishopR5Move(transformFen(c.fen,t)),expected,t.name);
 }
});

test('r5 anticipation requires an available knight jump, a legal Black trigger, and an available king step',()=>{
 const cases=[
  {fen:'1B6/8/8/3k4/8/8/5KN1/8 w - - 0 1',move:['f2','f3']},
  {fen:'B7/8/8/k7/8/8/8/5KN1 w - - 0 1'}, // Black cannot reach e3.
  {fen:'8/8/8/8/3k4/8/5B2/5KN1 w - - 0 1'}, // Bishop occupies f2.
  {fen:'8/8/8/8/3k4/8/4B3/5KN1 w - - 0 1'}, // Bishop occupies e2.
  {fen:'8/8/8/8/3k4/4B3/8/5KN1 w - - 0 1'}, // The trigger square is occupied by the bishop.
  {fen:'8/8/8/8/3k4/8/3B4/5KN1 w - - 0 1'}, // Bd2 controls the trigger e3.
 ] as const;
 for(const c of cases)for(const t of SQUARE_TRANSFORMS){
  const expected='move' in c?transformSquare(c.move[0],t)+transformSquare(c.move[1],t):undefined;
  assert.equal(knightAndBishopR5Move(transformFen(c.fen,t)),expected,`${c.fen} ${t.name}`);
 }
});
