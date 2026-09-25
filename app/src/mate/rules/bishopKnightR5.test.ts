import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare, squareFromCoords} from '../chess';
import {knightAndBishopR5Move} from './bishopKnightR5';
import {bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules} from './bishopKnight';
import {explainMove} from './selection';

const example='B7/8/8/8/8/2k5/2N5/3K4 w - - 0 1';

test('r5 chooses Ne1 and makes Kd2 legal after every Black reply, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen(example,t), board=getChess(fen);
  const from=transformSquare('c2',t),to=transformSquare('e1',t);
  assert.equal(knightAndBishopR5Move(fen),from+to,t.name);
  const san=board.move({from,to}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,san)?.id,'r5',t.name);
  for(const reply of board.moves()){
   board.move(reply);
   assert.ok(board.moves({verbose:true}).some(m=>m.from===transformSquare('d1',t)&&m.to===transformSquare('d2',t)),`${t.name} ${reply}`);
   board.undo();
  }
 }
});

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
