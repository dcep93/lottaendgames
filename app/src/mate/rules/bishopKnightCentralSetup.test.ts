import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {compareScoresByRules} from './selection';

const r4=knightAndBishopWhiteRules.find(rule=>rule.id==='r4')!;
const r45=knightAndBishopWhiteRules.find(rule=>rule.id==='r4.5')!;

test('r4 requires a starting central-four king and middle-16 knight, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const [start,enabled] of [
  ['B7/8/8/k7/3K4/5N2/8/8 w - - 0 1',true],
  ['B7/8/8/k7/5K2/5N2/8/8 w - - 0 1',false],
  ['B7/8/8/k7/6K1/5N2/8/8 w - - 0 1',false],
  ['B7/8/8/k7/3K4/8/5N2/8 w - - 0 1',false],
  ['B7/8/k7/8/3K4/5N2/8/8 w - - 0 1',true], // Bishop proximity does not gate r4.
 ] as const){
  const fen=transformFen(start,t);
  for(const san of getChess(fen).moves())assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(fen,san)),enabled,`${t.name} ${san}`);
 }
});

test('r4 reaches a protected opposite-color center, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/8/k7/3K4/5N2/8/8 w - - 0 1',t);
  const san=(from:'f3'|'d4',to:'e5'|'h2'|'e4'|'c4')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const target=scoreKnightAndBishopWhiteMove(fen,san('f3','e5'));
  const away=scoreKnightAndBishopWhiteMove(fen,san('f3','h2'));
  const protectedKnight=scoreKnightAndBishopWhiteMove(fen,san('d4','e4'));
  const exposed=scoreKnightAndBishopWhiteMove(fen,san('d4','c4'));
  assert.equal(target.knightOppositeCentralDistance,0,t.name);
  assert.ok(away.knightOppositeCentralDistance>0,t.name);
  assert.equal(protectedKnight.knightOppositeCentralDistance,exposed.knightOppositeCentralDistance,t.name);
  assert.equal(protectedKnight.kingKnightAdjacencyPenalty,0,t.name);
  assert.equal(exposed.kingKnightAdjacencyPenalty,1,t.name);
  assert.ok(compareScoresByRules(target,protectedKnight,[r4])<0,t.name);
  assert.ok(compareScoresByRules(protectedKnight,exposed,[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('f3','e5')],t.name);
 }
});

test('r4 prefers bishop central proximity after knight placement and protection, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/8/k3N3/3K4/8/8/8 w - - 0 1',t);
  const san=(to:'c6'|'b7'|'d5'|'e4')=>getChess(fen).move({from:transformSquare('a8',t),to:transformSquare(to,t)}).san;
  const center=scoreKnightAndBishopWhiteMove(fen,san('d5'));
  const nearby=scoreKnightAndBishopWhiteMove(fen,san('c6'));
  const distant=scoreKnightAndBishopWhiteMove(fen,san('b7'));
  assert.equal(center.knightOppositeCentralDistance,nearby.knightOppositeCentralDistance,t.name);
  assert.equal(center.kingKnightAdjacencyPenalty,nearby.kingKnightAdjacencyPenalty,t.name);
  assert.ok(center.bishopCentralProximityScore<nearby.bishopCentralProximityScore,t.name);
  assert.ok(nearby.bishopCentralProximityScore<distant.bishopCentralProximityScore,t.name);
  assert.ok(compareScoresByRules(center,nearby,[r4])<0,t.name);
  assert.ok(compareScoresByRules(nearby,distant,[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('e4')],t.name);
 }
});

test('r4 stays inactive throughout the reported Kc6 boundary shuffle, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/2K5/1N6/8/8/k7/8 w - - 0 1',t);
  const ch=getChess(fen);
  ch.move({from:transformSquare('b5',t),to:transformSquare('d6',t)});
  ch.move({from:transformSquare('a2',t),to:transformSquare('b1',t)});
  for(const position of [fen,ch.fen()])for(const move of getChess(position).moves()){
   assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(position,move)),false,`${t.name} ${move}`);
  }
  const retreat=ch.move({from:transformSquare('d6',t),to:transformSquare('b5',t)}).san;
  ch.undo();
  assert.ok(!getIdealKnightAndBishopWhiteMoves(ch.fen()).includes(retreat),t.name);
 }
});

test('r4 centralizes the bishop in the supplied Ba2 position, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/8/4N3/3K1k2/8/B7/8 w - - 22 12',t);
  const move=getChess(fen).move({from:transformSquare('a2',t),to:transformSquare('d5',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
 }
});

test('r4 stays active with the supplied bishop two steps from Black, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('2k5/8/2B5/3N4/4K3/8/8/8 w - - 2 2',t);
  for(const move of getChess(fen).moves())assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(fen,move)),true,`${t.name} ${move}`);
 }
});

test('r4 targets e5 rather than the occupied d4 square, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('2k1B3/8/8/8/3K4/2N5/8/8 w - - 2 2',t);
  const san=(to:'b5'|'e2'|'d5'|'e4')=>getChess(fen).move({from:transformSquare('c3',t),to:transformSquare(to,t)}).san;
  for(const to of ['b5','e2','d5','e4'] as const)assert.equal(scoreKnightAndBishopWhiteMove(fen,san(to)).knightOppositeCentralDistance,3,`${t.name} ${to}`);
  assert.deepEqual([...getIdealKnightAndBishopWhiteMoves(fen)].sort(),[san('d5'),san('e4')].sort(),t.name);
 }
});

test('r4 maneuvers the knight before r4.5 bishop clearance, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('Bk6/8/8/3N4/4K3/8/8/8 w - - 0 1',t);
  const ch=getChess(fen);
  const move=ch.move({from:transformSquare('a8',t),to:transformSquare('c6',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
  ch.move({from:transformSquare('b8',t),to:transformSquare('c8',t)});
  const next=ch.fen();
  const candidates=['a8','b7','d7'].map(to=>getChess(next).move({from:transformSquare('c6',t),to:transformSquare(to as 'a8'|'b7'|'d7',t)}).san);
  assert.deepEqual(candidates.map(san=>scoreKnightAndBishopWhiteMove(next,san).bishopTooCloseToBlackPenalty),[0,1,1],t.name);
  const expected=['f4','e3'].map(to=>getChess(next).move({from:transformSquare('d5',t),to:transformSquare(to as 'f4'|'e3',t)}).san);
  assert.deepEqual([...getIdealKnightAndBishopWhiteMoves(next)].sort(),expected.sort(),t.name);
  for(const san of expected)assert.equal(scoreKnightAndBishopWhiteMove(next,san).bishopTooCloseToBlackPenalty,0,t.name);
 }
});

test('r4 puts king protection before a shorter knight route, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B6k/8/8/2N5/3K4/8/8/8 w - - 0 1',t);
  const score=(to:'e4'|'d7')=>scoreKnightAndBishopWhiteMove(fen,getChess(fen).move({from:transformSquare('c5',t),to:transformSquare(to,t)}).san);
  const protectedMove=score('e4'),shorterRoute=score('d7');
  assert.equal(protectedMove.kingKnightAdjacencyPenalty,0,t.name);
  assert.equal(shorterRoute.kingKnightAdjacencyPenalty,1,t.name);
  assert.ok(protectedMove.knightOppositeCentralDistance>shorterRoute.knightOppositeCentralDistance,t.name);
  assert.ok(compareScoresByRules(protectedMove,shorterRoute,[r4])<0,t.name);
 }
});

test('r4 navigates bishop and king together toward their central targets, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/5k2/8/8/3NK3/8/8/8 w - - 0 1',t);
  const san=(from:'e4'|'a8',to:'e5'|'c6'|'d5')=>getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const king=san('e4','e5'),bishop=san('a8','c6');
  assert.ok(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen,bishop),scoreKnightAndBishopWhiteMove(fen,king),[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('a8','d5')],t.name);
 }
});

test('r4.5 leaves bishops two or more steps away tied, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/3Bk3/8/8/3NK3/8/8/8 w - - 0 1',t);
  const san=(to:'f5'|'g4'|'b5')=>getChess(fen).move({from:transformSquare('d7',t),to:transformSquare(to,t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('f5')).bishopTooCloseToBlackPenalty,0,t.name);
  for(const to of ['g4','b5'] as const)assert.equal(scoreKnightAndBishopWhiteMove(fen,san(to)).bishopTooCloseToBlackPenalty,0,t.name);
  assert.equal(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen,san('g4')),scoreKnightAndBishopWhiteMove(fen,san('f5')),[r45]),0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('f5')],t.name);
 }
});

test('r4 targets an unoccupied opposite-color central king square rather than leaving the center, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/5k2/8/3B4/3NK3/8/8/8 w - - 0 1',t);
  const score=(to:'e5'|'e3')=>scoreKnightAndBishopWhiteMove(fen,getChess(fen).move({from:transformSquare('e4',t),to:transformSquare(to,t)}).san);
  assert.equal(score('e5').bishopKingCentralNavigationScore,0,t.name);
  // d4 is occupied by the knight, so Ke3 is measured toward e5.
  assert.equal(score('e3').bishopKingCentralNavigationScore,4,t.name);
  assert.ok(compareScoresByRules(score('e5'),score('e3'),[r4])<0,t.name);
 }
});


test('r4.5 keeps bishop clearance active outside the r4 central setup, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('7K/8/8/8/Bk6/8/8/3N4 w - - 0 1',t);
  const score=(from:'a4'|'d1',to:'e8'|'f2')=>scoreKnightAndBishopWhiteMove(fen,getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san);
  const clear=score('a4','e8'),near=score('d1','f2');
  assert.equal(r4.applies!(clear),false,t.name);
  assert.equal(clear.bishopTooCloseToBlackPenalty,0,t.name);
  assert.equal(near.bishopTooCloseToBlackPenalty,1,t.name);
  assert.ok(compareScoresByRules(clear,near,[r45])<0,t.name);
 }
});

test('r4.5 lets Ne4 advance before answering a later bishop attack, across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen=transformFen('7K/8/8/8/1k6/2N5/B7/8 w - - 2 2',t);
  const ch=getChess(fen);
  const advance=ch.move({from:transformSquare('c3',t),to:transformSquare('e4',t)}).san;
  const retreat=getChess(fen).move({from:transformSquare('c3',t),to:transformSquare('b1',t)}).san;
  assert.equal(compareScoresByRules(scoreKnightAndBishopWhiteMove(fen,advance),scoreKnightAndBishopWhiteMove(fen,retreat),[r45]),0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[advance],t.name);
  ch.move({from:transformSquare('b4',t),to:transformSquare('a3',t)});
  const attacked=ch.fen();
  const escape=ch.move({from:transformSquare('a2',t),to:transformSquare('g8',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(attacked),[escape],t.name);
 }
});
