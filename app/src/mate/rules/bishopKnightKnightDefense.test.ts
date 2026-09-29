import assert from 'node:assert/strict';
import test from 'node:test';
import type {Square} from 'chess.js';
import {selectCandidatesByRules} from './selection';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
const rule=knightAndBishopWhiteRules.find(r=>r.id==='r4.6')!;
const placement=knightAndBishopWhiteRules.find(r=>r.id==='r4.7')!;

test('r4.6 accepts bishop moves, knight moves, and maintained stable bishop defense of an attacked knight equally across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const score=(fen:string,from:Square,to:Square)=>{
   const f=transformFen(fen,t);
   return scoreKnightAndBishopWhiteMove(f,getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san);
  };
  const bishop=score('7K/8/8/8/1kN5/8/8/5B2 w - - 0 1','f1','d3');
  const knight=score('7K/8/8/8/1k6/2N5/8/5B2 w - - 0 1','c3','b5');
  const maintained=score('7K/8/8/1N6/1k6/8/8/5B2 w - - 0 1','h8','h7');
  for(const s of [bishop,knight,maintained]) assert.equal(s.knightDefensePenalty,1,t.name);
  assert.equal(rule.compare!(bishop,knight),0,t.name);
  assert.equal(rule.compare!(knight,maintained),0,t.name);
 }
});

test('the culled rules are absent and king approach precedes defense and placement',()=>{
 assert.deepEqual(knightAndBishopWhiteRules.map(r=>r.id), ['mate','minors safe','no stalemate','r4','r4.5','r4.6','r4.7','r7','r20']);
});

test('r4.6 ranks defenses and r4.7 prefers White king proximity regardless of color across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const score=(wk:Square,to:Square,b:Square,n:Square)=>{
   const board=getChess('7K/8/8/8/8/8/8/k7 w - - 0 1');board.remove('h8');
   board.put({type:'k',color:'w'},wk);board.put({type:'b',color:'w'},b);board.put({type:'n',color:'w'},n);
   const f=transformFen(board.fen(),t);
   const san=getChess(f).move({from:transformSquare(wk,t),to:transformSquare(to,t)}).san;
   return scoreKnightAndBishopWhiteMove(f,san);
  };
  const king=score('a4','a5','f1','b5'), bishop=score('h7','h8','f1','b5');
  assert.equal(king.knightDefensePenalty,0,t.name);
  assert.equal(bishop.knightDefensePenalty,3,t.name);
  assert.ok(rule.compare!(king,bishop)<0,t.name);
  const unstable=score('h7','h8','a8','b7');
  assert.equal(unstable.knightDefensePenalty,3,t.name);
  assert.equal(rule.compare!(bishop,unstable),0,t.name);
  const sameColor=score('h7','h8','a8','c4'), oppositeColor=score('h7','h8','a8','d4');
  assert.equal(sameColor.knightDefensePenalty,3,t.name);
  assert.equal(oppositeColor.knightDefensePenalty,3,t.name);
  assert.ok(placement.compare!(oppositeColor,sameColor)<0,t.name);
  const equallyCentral=score('h7','h8','a8','c5');
  assert.equal(placement.compare!(equallyCentral,sameColor),0,t.name);
  const defendedOpposite=score('f3','e3','a8','d4');
  const defendedSame=score('f3','e3','a8','e4');
  const defendedOuter=score('f3','e3','a8','d3');
  assert.equal(defendedOpposite.knightDefensePenalty,0,t.name);
  assert.equal(defendedSame.knightDefensePenalty,0,t.name);
  assert.equal(defendedOuter.knightDefensePenalty,0,t.name);
  assert.equal(placement.compare!(defendedSame,defendedOpposite),0,t.name);
  assert.ok(placement.compare!(defendedOpposite,defendedOuter)<0,t.name);
  const central=score('h8','g8','h7','d5'), outer=score('h8','g8','h7','c4');
  assert.equal(central.knightDefensePenalty,outer.knightDefensePenalty,t.name);
  assert.ok(placement.compare!(central,outer)<0,t.name);
 }
});


test('r4.6 ties bishop setups for an attackable piece across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/8/8/8/K2k4/8/5NB1/8 w - - 4 3',t);
  const score=(from:Square,to:Square)=>scoreKnightAndBishopWhiteMove(f,
   getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san);
  const distantBishop=score('g2','d5');
  const undefendedKnight=score('g2','h1');
  assert.equal(distantBishop.knightDefensePenalty,1,t.name);
  assert.equal(rule.compare!(distantBishop,undefendedKnight),0,t.name);
 }
});


test('r4.7 prioritizes White king proximity ahead of centrality across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('3K4/8/2N5/8/5k2/8/8/7B w - - 4 3',t);
  const score=(to:Square)=>scoreKnightAndBishopWhiteMove(f,
   getChess(f).move({from:transformSquare('c6',t),to:transformSquare(to,t)}).san);
  const nearer=score('e5'), farther=score('d4'), outer=score('e7');
  assert.equal(nearer.knightCentralProximityScore,farther.knightCentralProximityScore,t.name);
  assert.ok(placement.compare!(nearer,farther)<0,t.name);
  // The closer-to-king e7 square outranks the central e5 square.
  assert.ok(outer.knightKingProximityScore<nearer.knightKingProximityScore,t.name);
  assert.ok(placement.compare!(outer,nearer)<0,t.name);
 }
});


test('r4.7 uses centrality when White king proximity ties across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/8/8/7k/8/2K5/8/2N4B w - - 0 1',t);
  const score=(to:Square)=>scoreKnightAndBishopWhiteMove(f,
   getChess(f).move({from:transformSquare('c1',t),to:transformSquare(to,t)}).san);
  const central=score('d3'), outer=score('b3');
  assert.equal(central.knightKingProximityScore,outer.knightKingProximityScore,t.name);
  assert.ok(placement.compare!(central,outer)<0,t.name);
 }
});


test('r4.7 ties diagonal and orthogonal king protection, then favors the central knight across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('B7/8/8/8/8/8/1k4K1/6N1 w - - 0 1',t);
  const score=(from:Square,to:Square)=>scoreKnightAndBishopWhiteMove(f,
   getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san);
  const central=score('g1','f3'), held=score('a8','b7');
  assert.equal(central.knightKingProximityScore,1,t.name);
  assert.equal(held.knightKingProximityScore,1,t.name);
  assert.ok(placement.compare!(central,held)<0,t.name);
 }
});


test('r4.6 moves an attacked bishop adjacent to the knight across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('5K2/8/8/8/Bk6/8/8/3N4 w - - 0 1',t);
  const san=(to:Square)=>getChess(f).move({from:transformSquare('a4',t),to:transformSquare(to,t)}).san;
  const adjacent=san('c2'), distant=san('e8');
  assert.equal(scoreKnightAndBishopWhiteMove(f,adjacent).knightDefensePenalty,1,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(f,distant).knightDefensePenalty,3,t.name);
  assert.ok(getIdealKnightAndBishopWhiteMoves(f).includes(adjacent),t.name);
  const quiet=transformFen('5K2/1k6/8/8/B7/8/8/3N4 w - - 0 1',t);
  assert.equal(scoreKnightAndBishopWhiteMove(quiet,adjacent).knightDefensePenalty,3,t.name);
 }
});


test('r4.6 drifts a bishop before Black can step into an attack across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('5K2/8/1k6/8/B7/8/8/3N4 w - - 0 1',t);
  const san=getChess(f).move({from:transformSquare('a4',t),to:transformSquare('c2',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(f,san).knightDefensePenalty,1,t.name);
 }
});


test('r4.6 anticipates knight attacks within two steps but not three across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  for(const [fen,expected] of [
   ['8/8/6k1/8/4N3/8/8/K6B w - - 0 1',1],
   ['8/7k/8/8/4N3/8/8/K6B w - - 0 1',3],
  ] as const){
   const f=transformFen(fen,t);
   const san=getChess(f).move({from:transformSquare('h1',t),to:transformSquare('f3',t)}).san;
   assert.equal(scoreKnightAndBishopWhiteMove(f,san).knightDefensePenalty,expected,t.name);
  }
 }
});


test('r4.6 does not activate knight attackability from a candidate move across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/1K6/8/2k2B2/8/8/2N5/8 w - - 0 1',t);
  const san=getChess(f).move({from:transformSquare('c2',t),to:transformSquare('e3',t)}).san;
  const ordinary=getChess(f).move({from:transformSquare('b7',t),to:transformSquare('c7',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(f,san).knightDefensePenalty,3,t.name);
  assert.equal(rule.compare!(scoreKnightAndBishopWhiteMove(f,san),scoreKnightAndBishopWhiteMove(f,ordinary)),0,t.name);
 }
});


test('r4.6 recognizes Bb3 then Nd5 setup and ties immediate Na4 defense across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/6K1/8/4k3/8/2N5/8/3B4 w - - 2 2',t);
  const san=(from:Square,to:Square)=>getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const setup=san('d1','b3'), retreat=san('c3','b5');
  assert.equal(scoreKnightAndBishopWhiteMove(f,setup).knightDefensePenalty,1,t.name);
  assert.equal(rule.compare!(scoreKnightAndBishopWhiteMove(f,setup),scoreKnightAndBishopWhiteMove(f,retreat)),0,t.name);
  const immediate=san('c3','a4');
  assert.equal(scoreKnightAndBishopWhiteMove(f,immediate).knightDefensePenalty,1,t.name);
  assert.equal(rule.compare!(scoreKnightAndBishopWhiteMove(f,immediate),scoreKnightAndBishopWhiteMove(f,setup)),0,t.name);
  const board=getChess(f);board.move(setup);
  board.move({from:transformSquare('e5',t),to:transformSquare('d4',t)});
  const next=board.fen();const jump=board.move({from:transformSquare('c3',t),to:transformSquare('d5',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(next,jump).knightDefensePenalty,1,t.name);
  assert.ok(getIdealKnightAndBishopWhiteMoves(next).includes(jump),t.name);
 }
});


test('r4.6 prepares knight protection when the bishop alone starts attacked across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/8/2B5/2k5/5K2/8/1N6/8 w - - 0 1',t);
  const san=(to:Square)=>getChess(f).move({from:transformSquare('c6',t),to:transformSquare(to,t)}).san;
  for(const to of ['e8','e4','f3'] as Square[]){
   assert.equal(scoreKnightAndBishopWhiteMove(f,san(to)).knightDefensePenalty,1,t.name);
  }
  assert.equal(scoreKnightAndBishopWhiteMove(f,san('h1')).knightDefensePenalty,3,t.name);
  const candidates=getChess(f).moves().map(san=>({san,score:scoreKnightAndBishopWhiteMove(f,san)}));
  const prefix=knightAndBishopWhiteRules.slice(0,knightAndBishopWhiteRules.findIndex(r=>r.id==='r4.6')+1);
  const accepted=selectCandidatesByRules(candidates,prefix).idealCandidates.map(c=>c.san);
  assert.ok(accepted.includes(san('e8')),t.name);
  assert.ok(accepted.includes(san('e4')),t.name);
  assert.ok(!getIdealKnightAndBishopWhiteMoves(f).includes(san('h1')),t.name);
 }
});


test('r4.6 checks both pieces before White moves so loaded Nd3 is not vetoed across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('4B3/8/8/3k1K2/8/8/1N6/8 w - - 0 1',t);
  const san=(from:Square,to:Square)=>getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const jump=san('b2','d3'), bishop=san('e8','h5');
  assert.equal(scoreKnightAndBishopWhiteMove(f,jump).knightDefensePenalty,3,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(f,bishop).knightDefensePenalty,3,t.name);
  assert.equal(rule.compare!(scoreKnightAndBishopWhiteMove(f,jump),scoreKnightAndBishopWhiteMove(f,bishop)),0,t.name);
 }
});


test('r4.6 ignores a king-defended bishop even when Black can legally approach it across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/8/8/5K2/2k1B3/8/8/N7 w - - 0 1',t);
  const move=getChess(f).move({from:transformSquare('e4',t),to:transformSquare('d5',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(f,move).knightDefensePenalty,3,t.name);
 }
});

test('r4.6 requires a legal Black approach rather than only a two-step radius across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  // Be4 controls d3/d5 and Nf3 controls d4: Black cannot approach Be4.
  const f=transformFen('7K/8/8/8/2k1B3/5N2/8/8 w - - 0 1',t);
  const move=getChess(f).move({from:transformSquare('e4',t),to:transformSquare('d5',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(f,move).knightDefensePenalty,3,t.name);
 }
});

test('r4.6 credits a knight establishing stable protection when only the bishop is attackable across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('7K/8/8/8/2k1B3/8/8/N7 w - - 0 1',t);
  const san=(from:Square,to:Square)=>getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const protectedKnight=scoreKnightAndBishopWhiteMove(f,san('a1','c2'));
  const setup=scoreKnightAndBishopWhiteMove(f,san('e4','d5'));
  assert.equal(protectedKnight.knightDefensePenalty,1,t.name);
  assert.equal(setup.knightDefensePenalty,1,t.name);
  assert.equal(rule.compare!(protectedKnight,setup),0,t.name);
 }
});

test('the loaded king-defended Be4 position selects Nc2 across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/8/8/4K3/2k1B3/8/8/N7 w - - 0 1',t);
  const jump=getChess(f).move({from:transformSquare('a1',t),to:transformSquare('c2',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(f,jump).knightDefensePenalty,3,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(f),[jump],t.name);
 }
});


test('r4.6 credits Nf5 preparing Bg4 stable protection across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const f=transformFen('8/3K4/8/7B/3k4/4N3/8/8 w - - 2 2',t);
  const san=(from:Square,to:Square)=>getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const setup=san('e3','f5'), retreat=san('e3','d1');
  assert.equal(scoreKnightAndBishopWhiteMove(f,setup).knightDefensePenalty,1,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(f,retreat).knightDefensePenalty,1,t.name);

  assert.ok(getIdealKnightAndBishopWhiteMoves(f).includes(setup),t.name);
  assert.ok(!getIdealKnightAndBishopWhiteMoves(f).includes(retreat),t.name);
  const board=getChess(f);board.move(setup);
  board.move({from:transformSquare('d4',t),to:transformSquare('e5',t)});
  const next=board.fen();
  const defense=board.move({from:transformSquare('h5',t),to:transformSquare('g4',t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(next,defense).knightDefensePenalty,1,t.name);
 }
});
