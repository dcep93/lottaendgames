import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {compareScoresByRules} from './selection';

const r4=knightAndBishopWhiteRules.find(rule=>rule.id==='r4')!;

test('r4 requires a starting central-four king, middle-16 knight, and distant bishop, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const [start,enabled] of [
  ['B7/8/8/k7/3K4/5N2/8/8 w - - 0 1',true],
  ['B7/8/8/k7/5K2/5N2/8/8 w - - 0 1',false],
  ['B7/8/8/k7/6K1/5N2/8/8 w - - 0 1',false],
  ['B7/8/8/k7/3K4/8/5N2/8 w - - 0 1',false],
  ['B7/8/k7/8/3K4/5N2/8/8 w - - 0 1',false], // Bishop only two king steps away.
 ] as const){
  const fen=transformFen(start,t);
  for(const san of getChess(fen).moves())assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(fen,san)),enabled,`${t.name} ${san}`);
 }
});

test('r4 reaches an opposite-color center before king protection, across D4',()=>{
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

test('r4 is inactive with the supplied bishop two steps from Black, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('2k5/8/2B5/3N4/4K3/8/8/8 w - - 2 2',t);
  for(const move of getChess(fen).moves())assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(fen,move)),false,`${t.name} ${move}`);
 }
});
