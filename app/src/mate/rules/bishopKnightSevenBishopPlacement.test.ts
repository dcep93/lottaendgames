import assert from 'node:assert/strict';
import test from 'node:test';
import {allSquares,getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {declaredSupportedSevenMove} from './bishopKnightSupportedPreferences';

test('r2.5 prefers Bf7 from every legal bishop origin with Kg7 Nd3 versus Ke7 across D4', () => {
 let tested=0;
 for(const origin of allSquares()) {
  if(['g7','d3','e7'].includes(origin))continue;
  const board=getChess('8/4k1K1/8/8/8/3N4/8/8 w - - 0 1');
  board.put({type:'b',color:'w'},origin);
  if(board.isAttacked('e7','w'))continue;
  if(!board.moves({verbose:true}).some(m=>m.piece==='b'&&m.to==='f7'))continue;
  for(const t of SQUARE_TRANSFORMS) {
   const f=transformFen(board.fen(),t);
   const move=getChess(f).move({from:transformSquare(origin,t),to:transformSquare('f7',t)}).san;
   assert.equal(scoreKnightAndBishopWhiteMove(f,move).supportedDiagonalSizeScore,7);
   assert.deepEqual(getIdealKnightAndBishopWhiteMoves(f),[move],origin+' '+t.name);
   tested++;
  }
 }
 assert.ok(tested>=40);
});

test('the declaration does not prescribe an illegal bishop move or a different king arrangement',()=>{
 assert.equal(declaredSupportedSevenMove('8/4k1K1/8/8/8/3N4/B7/8 w - - 0 1'),'a2f7');
 assert.equal(declaredSupportedSevenMove('8/4k1K1/8/8/8/3N4/8/B7 w - - 0 1'),undefined);
 assert.equal(declaredSupportedSevenMove('8/4k3/6K1/8/8/1B1N4/8/8 w - - 0 1'),undefined);
});
