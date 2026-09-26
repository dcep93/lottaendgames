import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {compareScoresByRules} from './selection';

const r4=knightAndBishopWhiteRules.find(rule=>rule.id==='r4')!;

test('r4 requires both king and knight in the starting middle 16, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS)for(const [start,enabled] of [
  ['B7/8/k7/8/5K2/5N2/8/8 w - - 0 1',true],
  ['B7/8/k7/8/6K1/5N2/8/8 w - - 0 1',false],
  ['B7/8/k7/8/5K2/8/5N2/8 w - - 0 1',false],
 ] as const){
  const fen=transformFen(start,t);
  for(const san of getChess(fen).moves())assert.equal(r4.applies!(scoreKnightAndBishopWhiteMove(fen,san)),enabled,`${t.name} ${san}`);
 }
});

test('r4 reaches an opposite-color central square, then chooses king protection, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/k7/8/5K2/5N2/8/8 w - - 0 1',t);
  const san=(to:'d4'|'e5'|'h2')=>getChess(fen).move({from:transformSquare('f3',t),to:transformSquare(to,t)}).san;
  const exposed=scoreKnightAndBishopWhiteMove(fen,san('d4'));
  const protectedCenter=scoreKnightAndBishopWhiteMove(fen,san('e5'));
  const away=scoreKnightAndBishopWhiteMove(fen,san('h2'));
  assert.equal(exposed.knightOppositeCentralDistance,0,t.name);
  assert.equal(protectedCenter.knightOppositeCentralDistance,0,t.name);
  assert.ok(away.knightOppositeCentralDistance>0,t.name);
  assert.equal(exposed.kingKnightAdjacencyPenalty,1,t.name);
  assert.equal(protectedCenter.kingKnightAdjacencyPenalty,0,t.name);
  assert.ok(compareScoresByRules(exposed,away,[r4])<0,t.name);
  assert.ok(compareScoresByRules(protectedCenter,exposed,[r4])<0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('e5')],t.name);
 }
});

test('r4 requires both a long-diagonal bishop and knight protection for its last preference, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('B7/8/k7/4NK2/8/8/8/8 w - - 0 1',t);
  const san=(to:'c6'|'b7'|'d5'|'f3')=>getChess(fen).move({from:transformSquare('a8',t),to:transformSquare(to,t)}).san;
  const defended=scoreKnightAndBishopWhiteMove(fen,san('c6'));
  const longOnly=scoreKnightAndBishopWhiteMove(fen,san('b7'));
  const centralOnly=scoreKnightAndBishopWhiteMove(fen,san('d5'));
  assert.equal(defended.knightProtectedLongDiagonalBishopPenalty,0,t.name);
  assert.equal(longOnly.knightProtectedLongDiagonalBishopPenalty,1,t.name);
  assert.equal(centralOnly.knightProtectedLongDiagonalBishopPenalty,1,t.name);
  assert.ok(compareScoresByRules(defended,longOnly,[r4])<0,t.name);
  assert.ok(compareScoresByRules(defended,centralOnly,[r4])<0,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('f3')).knightProtectedLongDiagonalBishopPenalty,0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('f3')],t.name);
 }
});

test('new r4 breaks the supplied bishop waiting shuttle across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('8/8/4k3/8/4NK2/8/8/7B w - - 0 1',t);
  const move=getChess(fen).move({from:transformSquare('e4',t),to:transformSquare('g3',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
 }
});
