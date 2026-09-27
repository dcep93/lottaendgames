import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess,SQUARE_TRANSFORMS,transformFen,transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves,knightAndBishopWhiteRules,scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {compareScoresByRules,selectCandidatesByRules} from './selection';

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

test('r4 maneuvers the knight in the supplied Bc6 position, across D4',()=>{
 for(const t of SQUARE_TRANSFORMS){
  const fen=transformFen('Bk6/8/8/3N4/4K3/8/8/8 w - - 0 1',t);
  const ch=getChess(fen);
  const move=ch.move({from:transformSquare('a8',t),to:transformSquare('c6',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
  ch.move({from:transformSquare('b8',t),to:transformSquare('c8',t)});
  const next=ch.fen();
  const expected=['f4','e3'].map(to=>getChess(next).move({from:transformSquare('d5',t),to:transformSquare(to as 'f4'|'e3',t)}).san);
  assert.deepEqual([...getIdealKnightAndBishopWhiteMoves(next)].sort(),expected.sort(),t.name);
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

test('r4.5 treats bishop escapes outside the king-knight rectangle equally, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const [start, from, to] of [
    ['1KB5/8/1k6/4N3/8/8/8/8 w - - 0 1', 'c8', 'h3'],
    ['4BK2/8/5k2/2N5/8/8/8/8 w - - 0 1', 'e8', 'a4'],
    ['KB6/8/k7/3N4/8/8/8/8 w - - 0 1', 'b8', 'h2'],
  ] as const) {
    const fen = transformFen(start, t);
    const move = getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.ok(selectCandidatesByRules(candidates, [r45]).idealCandidates.some(c => c.san === move), t.name);
  }
});

test('r4.5 maximizes separation only when starting adjacent to a noncentral king, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const [start, enabled] of [
    ['8/8/8/3BK3/8/8/1N6/k7 w - - 0 1', false],
    ['8/8/3BK3/8/8/8/1N6/k7 w - - 0 1', true],
    ['8/8/4K3/3B4/8/8/1N6/k7 w - - 0 1', true],
    ['8/8/4K3/8/2B5/8/1N6/k7 w - - 0 1', false],
    ['7K/8/8/8/Bk6/8/8/3N4 w - - 0 1', false],
    ['NK6/8/8/8/4B3/4k3/8/8 w - - 0 1', false],
  ] as const) {
    const fen = transformFen(start, t);
    for (const move of getChess(fen).moves()) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).startsWithBishopAdjacentToNoncentralKing, enabled, `${t.name} ${move}`);
    }
  }
});


test('r4.5 includes the center when rejecting crowded bishop moves across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('Bk6/8/8/8/8/8/8/6KN w - - 0 1', t);
    const san = (to: 'g2' | 'f3' | 'e4') => getChess(fen).move({from: transformSquare('a8', t), to: transformSquare(to, t)}).san;
    const clear = scoreKnightAndBishopWhiteMove(fen, san('e4'));
    assert.equal(clear.bishopMoveNearNoncentralKingPenalty, 0, t.name);
    for (const to of ['g2', 'f3'] as const) {
      const crowded = scoreKnightAndBishopWhiteMove(fen, san(to));
      assert.equal(crowded.bishopMoveNearNoncentralKingPenalty, 1, t.name);
      assert.ok(compareScoresByRules(clear, crowded, [r45]) < 0, t.name);
    }

  }
});


test('r4.5 allows Kg4 to approach the bishop without moving it, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/4B3/6N1/3k3K/8/8/8 w - - 0 1', t);
    const move = getChess(fen).move({from: transformSquare('h4', t), to: transformSquare('g4', t)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.startsWithBishopAdjacentToNoncentralKing, false, t.name);
    assert.equal(score.bishopMoveNearNoncentralKingPenalty, 0, t.name);
    assert.equal(score.bishopWhiteKingDistanceScore, 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move], t.name);
  }
});

test('r4.5 exempts even an immobile bishop outside the king-knight rectangle, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const start of [
    'B1K5/2N5/3k4/8/8/8/8/8 w - - 0 1',
    'B1K5/2N5/8/4k3/8/8/8/8 w - - 0 1',
  ]) {
    const fen = transformFen(start, t);
    const move = (to: 'b7' | 'd8') => getChess(fen).move({from: transformSquare('c8', t), to: transformSquare(to, t)}).san;
    const trapped = scoreKnightAndBishopWhiteMove(fen, move('b7'));
    const free = scoreKnightAndBishopWhiteMove(fen, move('d8'));
    assert.equal(trapped.immobileBishopPenalty, 0, t.name);
    assert.equal(free.immobileBishopPenalty, 0, t.name);
    assert.equal(compareScoresByRules(free, trapped, [r45]), 0, t.name);

  }
});


test('r4.5 exempts the loaded Be8 outside d7-h5 but still penalizes crowding inside, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('4B3/3K4/8/5k1N/8/8/8/8 w - - 2 2', t);
    const move = getChess(fen).move({from: transformSquare('h5', t), to: transformSquare('g7', t)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.immobileBishopPenalty, 0, t.name);
    assert.equal(score.bishopMoveNearNoncentralKingPenalty, 0, t.name);
    assert.equal(score.bishopWhiteKingDistanceScore, 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move], t.name);
    const inside = transformFen('8/7k/5N2/8/8/1K6/8/B7 w - - 0 1', t);
    const crowded = getChess(inside).move({from: transformSquare('a1', t), to: transformSquare('c3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(inside, crowded).bishopMoveNearNoncentralKingPenalty, 1, t.name);
  }
});


test('r4.5 includes the four central squares in the loaded clutter rectangle, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/4B3/4k3/8/8/KN6/8 w - - 0 1', t);
    const move = (to: 'b3' | 'c8' | 'h3') => getChess(fen).move({from: transformSquare('e6', t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b3')).bishopMoveNearNoncentralKingPenalty, 1, t.name);
    for (const to of ['c8', 'h3'] as const) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move(to)).bishopMoveNearNoncentralKingPenalty, 0, t.name);
    }
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen).sort(), [move('c8'), move('h3')].sort(), t.name);
  }
});

test('r4 preserves the central king and middle-16 knight before maneuvering, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4K3/8/k2N4/B7/8 w - - 2 2', t);
    const san = (from: 'a2' | 'd3' | 'e5', to: 'g8' | 'd5' | 'c1' | 'e6') => getChess(fen).move({
      from: transformSquare(from, t), to: transformSquare(to, t),
    }).san;
    const retained = scoreKnightAndBishopWhiteMove(fen, san('a2', 'g8'));
    for (const move of [san('d3', 'c1'), san('e5', 'e6')]) {
      const leaving = scoreKnightAndBishopWhiteMove(fen, move);
      assert.equal(leaving.centralSetupBoundaryPenalty, 1, `${t.name} ${move}`);
      assert.ok(compareScoresByRules(retained, leaving, [r4]) < 0, `${t.name} ${move}`);
    }
    assert.equal(retained.centralSetupBoundaryPenalty, 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('a2', 'd5')], t.name);
  }
});
