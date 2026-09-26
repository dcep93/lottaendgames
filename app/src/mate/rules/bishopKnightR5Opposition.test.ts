import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {bishopKnightRuleSet,getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {knightAndBishopR5OppositionMoves} from './bishopKnightR5Opposition';
import {explainMove} from './selection';

const start='4B3/8/8/8/8/2k5/1N6/2K5 w - - 0 1';
test('r5 waits to save the bishop when its king advance would leave it hanging, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/1Bk5/8/8/3KN3/8 w - - 0 1',t);
  const san=(from:'b5'|'e2',to:'e8'|'c3')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const wait=san('b5','e8'),shuffle=san('e2','c3');
  assert.deepEqual(knightAndBishopR5OppositionMoves(fen),['b'],t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,shuffle).declaredPreparationPenalty,1,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,wait).declaredPreparationPenalty,0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[wait],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,wait)?.id,'r5',t.name);
 }
});

test('r5 still advances when the attacked bishop keeps knight protection, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/8/8/1k6/1B6/2KN4 w - - 0 1',t);
  assert.deepEqual(knightAndBishopR5OppositionMoves(fen),[transformSquare('c1',t)+transformSquare('d2',t)],t.name);
 }
});

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

test('r5 maximizes bishop Euclidean distance during the waiting step, across D4',()=>{
 const rule=knightAndBishopWhiteRules.find(r=>r.id==='r5')!;
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('4B3/8/8/8/8/3k4/8/2KN4 w - - 2 2',t);
  const san=(to:'d7'|'f7'|'h5')=>getChess(fen).move({from:transformSquare('e8',t),to:transformSquare(to,t)}).san;
  const near=scoreKnightAndBishopWhiteMove(fen,san('d7'));
  const far=scoreKnightAndBishopWhiteMove(fen,san('f7'));
  const equallyFar=scoreKnightAndBishopWhiteMove(fen,san('h5'));
  assert.equal(near.preparationBishopWaitDistance,-16,t.name);
  assert.equal(far.preparationBishopWaitDistance,-20,t.name);
  assert.ok(rule.compare!(far,near)<0,t.name);
  assert.equal(rule.compare!(far,equallyFar),0,t.name);
  for(const move of getIdealKnightAndBishopWhiteMoves(fen))assert.ok([san('f7'),san('h5')].includes(move),`${t.name} ${move}`);
  const outside=scoreKnightAndBishopWhiteMove(transformFen(start,t),getChess(transformFen(start,t)).move({from:transformSquare('e8',t),to:transformSquare('d7',t)}).san);
  assert.equal(outside.preparationBishopWaitDistance,0,t.name);
 }
});

test('r5 chooses Bh7 for the waiting position from the reported loop, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('6B1/8/8/8/8/N1k5/K7/8 w - - 0 1',t);
  const san=getChess(fen).move({from:transformSquare('g8',t),to:transformSquare('h7',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,san)?.id,'r5',t.name);
 }
});

test('r5 waits with Bh5 then advances Kb2 when Na1 is behind Ka2, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const board=getChess(transformFen('4B3/8/8/8/8/2k5/K7/N7 w - - 0 1',t));
  assert.deepEqual(knightAndBishopR5OppositionMoves(board.fen()),['b'],t.name);
  const wait=getChess(board.fen()).move({from:transformSquare('e8',t),to:transformSquare('h5',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(board.fen()),[wait],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(board.fen(),board.moves()),knightAndBishopWhiteRules,wait)?.id,'r5',t.name);
  const far=scoreKnightAndBishopWhiteMove(board.fen(),wait);
  for(const m of board.moves({verbose:true}).filter(m=>m.piece==='b')){
   assert.ok(far.preparationBishopWaitDistance<=scoreKnightAndBishopWhiteMove(board.fen(),m.san).preparationBishopWaitDistance,t.name);
  }
  board.move(wait);board.move({from:transformSquare('c3',t),to:transformSquare('d4',t)});
  const advance=getChess(board.fen()).move({from:transformSquare('a2',t),to:transformSquare('b2',t)}).san;
  assert.deepEqual(knightAndBishopR5OppositionMoves(board.fen()),[transformSquare('a2',t)+transformSquare('b2',t)],t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(board.fen()),[advance],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(board.fen(),board.moves()),knightAndBishopWhiteRules,advance)?.id,'r5',t.name);
  board.move(advance);
  assert.ok(board.isAttacked(transformSquare('a1',t),'w'),t.name);
 }
});

test('r5 does not hop an inward knight when the king can slide behind it, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/1K1k4/2N5/8/8/8/8/8 w - - 0 1',t);
  assert.equal(knightAndBishopR5OppositionMoves(fen),undefined,t.name);
  const advance=getChess(fen).move({from:transformSquare('b7',t),to:transformSquare('b6',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[advance],t.name);
  // The original check remains necessary when both inward slides are blocked.
  assert.deepEqual(knightAndBishopR5OppositionMoves(transformFen(start,t)),[transformSquare('b2',t)+transformSquare('d1',t)],t.name);
 }
});
