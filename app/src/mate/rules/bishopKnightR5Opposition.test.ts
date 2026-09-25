import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {knightAndBishopR5OppositionMoves} from './bishopKnightR5Opposition';
import {explainMove} from './selection';

const start='4B3/8/8/8/8/2k5/1N6/2K5 w - - 0 1';
test('r5 checks opposition, advances after Kb3, and waits before advancing after Kd3, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const waiting of [false,true]){
   const board=getChess(transformFen(start,t));
   const play=(from:Parameters<typeof transformSquare>[0],to:Parameters<typeof transformSquare>[0])=>{
    const before=board.fen(),move=board.move({from:transformSquare(from,t),to:transformSquare(to,t)});
    return {before,san:move.san};
   };
   const preferred=(from:Parameters<typeof transformSquare>[0],to:Parameters<typeof transformSquare>[0])=>{
    const {before,san}=play(from,to);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before),[san],t.name);
    assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(before,getChess(before).moves()),knightAndBishopWhiteRules,san)?.id,'r5',t.name);
   };
   preferred('b2','d1');
   play('c3',waiting?'d3':'b3');
   if(waiting){
    assert.deepEqual(knightAndBishopR5OppositionMoves(board.fen()),['b'],t.name);
    for(const m of board.moves({verbose:true}))assert.equal(scoreKnightAndBishopWhiteMove(board.fen(),m.san).declaredPreparationPenalty,m.piece==='b'?0:1,`${t.name} ${m.san}`);
    play('e8','d7');play('d3','d4');
   }
   preferred('c1','d2');
  }
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
