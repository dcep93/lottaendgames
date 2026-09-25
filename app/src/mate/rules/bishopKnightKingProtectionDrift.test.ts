import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {bishopKnightRuleSet, knightAndBishopWhiteRules, getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {knightKingProtectionDistance} from './bishopKnightStrategy';
import {explainMove} from './selection';

test('r6 prefers Nf2 toward White king protection across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const f = transformFen('6B1/5K2/8/8/8/8/3k4/3N4 w - - 0 1', t);
  const move = (to: 'f2' | 'b2') => getChess(f).move({from:transformSquare('d1',t),to:transformSquare(to,t)}).san;
  assert.ok(getIdealKnightAndBishopWhiteMoves(f).includes(move('f2')),t.name);
  assert.ok(scoreKnightAndBishopWhiteMove(f,move('f2')).knightKingProtectionDistance < scoreKnightAndBishopWhiteMove(f,move('b2')).knightKingProtectionDistance,t.name);
 }
});

test('a knight already defended by White king has zero remaining moves', () => {
 assert.equal(knightKingProtectionDistance('6B1/5K2/4N3/8/8/8/3k4/8 w - - 0 1'),0);
});


test('r6 has no special preference for establishing a precage knight across D4', () => {
 const start = '6B1/8/8/5k1K/2N5/8/8/8 w - - 0 1';
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen(start, t);
  const move = (to: 'd5' | 'f7') => getChess(fen).move({from:transformSquare('g8',t),to:transformSquare(to,t)}).san;
  const precage = scoreKnightAndBishopWhiteMove(fen,move('d5'));
  const away = scoreKnightAndBishopWhiteMove(fen,move('f7'));
  assert.equal(precage.knightTargetProximityScore,0);
  assert.equal(away.knightTargetProximityScore,99);
  assert.equal(rule.compare!(precage,away),0);
  // Ne3 has the protected continuation Ng4 regardless of the precage label.
  const knightMove = getChess(fen).move({from:transformSquare('c4',t),to:transformSquare('e3',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[knightMove]);
 }
});

test('r6 continues drifting even when the knight is on precage', () => {
 const fen = '8/3k4/8/3B4/2N2K2/8/8/8 w - - 0 1';
 const near = scoreKnightAndBishopWhiteMove(fen,'Ke4');
 const far = scoreKnightAndBishopWhiteMove(fen,'Kg4');
 assert.equal(near.knightTargetProximityScore,0);
 assert.equal(far.knightTargetProximityScore,0);
 assert.notEqual(near.knightKingProtectionDistance,far.knightKingProtectionDistance);
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 assert.ok(rule.compare!(near,far)<0);
});


test('r6 gives no progress credit for unprotected knight opposition toward the edge across D4', () => {
 const cases = [
  {fen: '6K1/8/Nk6/8/8/8/8/3B4 w - - 0 1', from: 'a6', to: 'b8'},
  {fen: '4B1K1/8/8/1Nk5/8/8/8/8 w - - 14 8', from: 'b5', to: 'c7'},
 ] as const;
 for (const example of cases) for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen(example.fen, t);
  const chess = getChess(fen);
  const san = chess.move({from: transformSquare(example.from, t), to: transformSquare(example.to, t)}).san;
  const before = knightKingProtectionDistance(fen);
  assert.ok(knightKingProtectionDistance(chess.fen()) <= before, t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen, san).knightKingProtectionDistance, before, t.name);
  const candidate = scoreKnightAndBishopWhiteMove(fen, san);
  assert.equal(candidate.knightDriftBlocked, true, t.name);
  assert.equal(candidate.knightDriftObstructionPenalty, 2, t.name);
  assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(san), t.name);
 }
});

test('r6 still credits reaching king protection in knight opposition across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('4B3/3K4/8/1Nk5/8/8/8/8 w - - 0 1', t);
  const san = getChess(fen).move({from: transformSquare('b5', t), to: transformSquare('c7', t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen, san).knightKingProtectionDistance, 0, t.name);
 }
});


test('r6 breaks equal protection-distance ties toward White king: Nb2 over Nb6 across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('8/7B/8/8/Nk6/8/8/3K4 w - - 0 1', t);
  const san = (to: 'b2' | 'b6') => getChess(fen).move({from: transformSquare('a4', t), to: transformSquare(to, t)}).san;
  const toward = scoreKnightAndBishopWhiteMove(fen, san('b2'));
  const away = scoreKnightAndBishopWhiteMove(fen, san('b6'));
  assert.equal(toward.knightKingProtectionDistance, away.knightKingProtectionDistance);
  assert.ok(rule.compare!(toward, away) < 0, t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('b2')], t.name);
 }
});


test('r6 prefers escaping obstruction over a route Black can obstruct again across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('K7/8/8/7B/2k5/2N5/8/8 w - - 0 1', t);
  const san = (to: 'd1' | 'e4') => getChess(fen).move({from: transformSquare('c3', t), to: transformSquare(to, t)}).san;
  const retreat = scoreKnightAndBishopWhiteMove(fen, san('d1'));
  const toward = scoreKnightAndBishopWhiteMove(fen, san('e4'));
  assert.equal(retreat.knightDriftBlocked, true);
  assert.ok(rule.compare!(retreat, toward) < 0);
 }
});


test('r6 rejects Nb8 despite equal king-step distance, preferring Nb4 across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('6K1/8/Nk6/8/8/8/8/3B4 w - - 0 1', t);
  const san = (to: 'b4' | 'b8') => getChess(fen).move({from: transformSquare('a6', t), to: transformSquare(to, t)}).san;
  const safe = scoreKnightAndBishopWhiteMove(fen, san('b4'));
  const edge = scoreKnightAndBishopWhiteMove(fen, san('b8'));
  assert.equal(safe.knightDriftBlocked, true);
  assert.equal(edge.knightDriftBlocked, true);
  assert.equal(edge.kingKnightDistanceScore, safe.kingKnightDistanceScore);
  assert.ok(rule.compare!(safe, edge) < 0, t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('b4')], t.name);
 }
});


test('r6 allows Ne2 and Nb5 but rejects Nc6 after Nd4 Ke5 across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 const board = getChess('7K/8/2Nk4/8/8/8/8/5B2 w - - 0 1');
 board.move('Nd4');
 board.move('Ke5');
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen(board.fen(), t);
  const san = (to: 'e2' | 'c6' | 'b5') => getChess(fen).move({from: transformSquare('d4', t), to: transformSquare(to, t)}).san;
  const escape = scoreKnightAndBishopWhiteMove(fen, san('e2'));
  const back = scoreKnightAndBishopWhiteMove(fen, san('c6'));
  assert.equal(escape.knightDriftBlocked, true);
  assert.equal(escape.knightDriftObstructionPenalty, 0);
  assert.ok(back.knightDriftObstructionPenalty > escape.knightDriftObstructionPenalty);
  const otherEscape = scoreKnightAndBishopWhiteMove(fen, san('b5'));
  assert.ok(rule.compare!(escape, back) < 0, t.name);
  assert.equal(rule.compare!(escape, otherEscape), 0, t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('b5')], t.name);
 }
});


test('diagonal adjacency behind the knight does not block drift across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('7K/8/8/8/3N4/2k5/8/5B2 w - - 0 1', t);
  const san = getChess(fen).move({from: transformSquare('d4', t), to: transformSquare('e2', t)}).san;
  assert.equal(scoreKnightAndBishopWhiteMove(fen, san).knightDriftBlocked, false, t.name);
 }
});

test('r6 rejects the Na7 pocket and brings the king forward instead across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('2N3B1/8/2k5/8/8/8/K7/8 w - - 2 2', t);
  const san = (from: 'c8' | 'a2', to: 'a7' | 'b3') => getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const pocket = san('c8','a7'), approach = san('a2','b3');
  assert.ok(rule.compare!(scoreKnightAndBishopWhiteMove(fen,approach),scoreKnightAndBishopWhiteMove(fen,pocket)) < 0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[approach],t.name);
  const board=getChess(fen);
  board.move(pocket);
  board.move({from:transformSquare('c6',t),to:transformSquare('b6',t)});
  const safeKnightMoves=board.moves({verbose:true}).filter(m=>m.piece==='n').filter(m=>{
   board.move(m);const safe=!board.moves({verbose:true}).some(r=>r.captured==='n');board.undo();return safe;
  });
  assert.deepEqual(safeKnightMoves.map(m=>m.to),[transformSquare('c8',t)],t.name);
 }
});

test('r6 allows Nb7 because Kc8 can establish protection after Kb6 across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('3K4/8/8/Nk6/8/7B/8/8 w - - 0 1', t);
  const board = getChess(fen);
  const move = board.move({from: transformSquare('a5',t),to:transformSquare('b7',t)}).san;
  assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(move),t.name);
  assert.ok(scoreKnightAndBishopWhiteMove(fen,move).knightDriftObstructionPenalty < 2,t.name);
  board.move({from:transformSquare('b5',t),to:transformSquare('b6',t)});
  board.move({from:transformSquare('d8',t),to:transformSquare('c8',t)});
  assert.equal(board.isAttacked(transformSquare('b7',t),'w'),true,t.name);
 }
});

test('r6 does not credit Nf1 retreat; r7 chooses Kh5 and Ng4 is protected after every reply across D4', () => {
 const r6 = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('B7/8/7K/8/5k2/8/7N/8 w - - 2 2', t);
  const san = (from: 'h2' | 'h6', to: 'f1' | 'h5' | 'g6') => getChess(fen)
    .move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
  const retreat = san('h2','f1'), approach = san('h6','h5');
  const approachScore = scoreKnightAndBishopWhiteMove(fen,approach);
  assert.ok(r6.compare!(approachScore,scoreKnightAndBishopWhiteMove(fen,retreat)) < 0,t.name);
  assert.equal(r6.compare!(approachScore,scoreKnightAndBishopWhiteMove(fen,san('h6','g6'))),0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[approach],t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,approach)?.id,'r7',t.name);
  const board = getChess(fen); board.move(approach);
  for (const reply of board.moves()) {
   board.move(reply);
   board.move({from:transformSquare('h2',t),to:transformSquare('g4',t)});
   assert.equal(board.isAttacked(transformSquare('g4',t),'w'),true,t.name);
   assert.ok(!board.moves({verbose:true}).some(m=>m.captured==='n'),t.name);
   board.undo(); board.undo();
  }
 }
});

test('Nc1 remains a viable route but stable Bg8 protection defers to Ke2 under r7 across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('6B1/8/8/8/8/1Nk5/8/5K2 w - - 2 2',t);
  const board = getChess(fen);
  const move = board.move({from:transformSquare('b3',t),to:transformSquare('c1',t)}).san;
  const kingMove = getChess(fen).move({from:transformSquare('f1',t),to:transformSquare('e2',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[kingMove],t.name);
  assert.equal(knightAndBishopWhiteRules.find(r=>r.id==='r6')!.applies!(scoreKnightAndBishopWhiteMove(fen,move)),false,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move).knightDriftObstructionPenalty,0,t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,kingMove)?.id,'r7',t.name);
  for (const reply of board.moves()) {
   board.move(reply);
   board.move({from:transformSquare('c1',t),to:transformSquare('e2',t)});
   assert.equal(board.isAttacked(transformSquare('e2',t),'w'),true,t.name);
   assert.ok(!board.moves({verbose:true}).some(m=>m.captured==='n'),t.name);
   board.undo(); board.undo();
  }
 }
});

test('Nd4 remains a viable route but stable Bg8 protection defers to Kb6 under r7 across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('6B1/K7/8/8/1k6/1N6/8/8 w - - 2 2',t);
  const board = getChess(fen);
  const move = board.move({from:transformSquare('b3',t),to:transformSquare('d4',t)}).san;
  const kingMove = getChess(fen).move({from:transformSquare('a7',t),to:transformSquare('b6',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[kingMove],t.name);
  assert.equal(knightAndBishopWhiteRules.find(r=>r.id==='r6')!.applies!(scoreKnightAndBishopWhiteMove(fen,move)),false,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,move).knightDriftObstructionPenalty,0,t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,kingMove)?.id,'r7',t.name);
  for (const reply of board.moves()) {
   board.move(reply);
   board.move({from:transformSquare('d4',t),to:transformSquare('e6',t)});
   assert.equal(board.isAttacked(transformSquare('e6',t),'w'),true,t.name);
   assert.ok(!board.moves({verbose:true}).some(m=>m.captured==='n'),t.name);
   board.undo(); board.undo();
  }
 }
});

test('r6 equally values Nc3 and Ne3 inside the central 16 across D4', () => {
 const r6 = knightAndBishopWhiteRules.find(r=>r.id==='r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('B7/8/8/8/8/k7/3K4/3N4 w - - 0 1',t);
  const san = (to: 'c3' | 'e3') => getChess(fen).move({from:transformSquare('d1',t),to:transformSquare(to,t)}).san;
  const center = scoreKnightAndBishopWhiteMove(fen,san('e3'));
  const other = scoreKnightAndBishopWhiteMove(fen,san('c3'));
  assert.deepEqual(center.knightDriftScore,other.knightDriftScore,t.name);
  assert.equal(center.knightMiddle16ProximityScore,0,t.name);
  assert.equal(other.knightMiddle16ProximityScore,0,t.name);
  assert.equal(r6.compare!(center,other),0,t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('e3')],t.name);
 }
});


test('r6 routes via Nc4 when the edge bishop occupies the Nb7 rescue square across D4', () => {
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('2BK4/8/1k6/N7/8/8/8/8 w - - 0 1',t);
  const san = (to: 'c4' | 'b7') => getChess(fen).move({from:transformSquare('a5',t),to:transformSquare(to,t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san('c4')],t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('b7')).knightDriftObstructionPenalty,2,t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,san('c4')).knightDriftObstructionPenalty,0,t.name);
  const board=getChess(fen);
  board.move(san('b7'));
  board.move({from:transformSquare('b6',t),to:transformSquare('c6',t)});
  assert.ok(!board.moves({verbose:true}).some(m=>m.piece==='k' && m.to===transformSquare('c8',t)),t.name);
  assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,san('c4'))?.id,'r6',t.name);
 }
});


test('r6 skips drift and centralization only with stable bishop protection at the start across D4', () => {
 const r6=knightAndBishopWhiteRules.find(r=>r.id==='r6')!;
 const cases=[
  {fen:'8/8/4B3/8/8/1N1k2K1/8/8 w - - 0 1', active:false},
  {fen:'8/8/2B5/1N6/8/8/5k2/7K w - - 0 1', active:false},
  {fen:'2B4K/1N6/8/8/8/8/5k2/8 w - - 0 1', active:true},
  {fen:'2BK4/8/1k6/N7/8/8/8/8 w - - 0 1', active:true},
 ] as const;
 for(const c of cases) for(const t of SQUARE_TRANSFORMS) {
  const fen=transformFen(c.fen,t);
  for(const move of getChess(fen).moves())
   assert.equal(r6.applies!(scoreKnightAndBishopWhiteMove(fen,move)),c.active,`${t.name} ${move}`);
 }
});


test('r6 rejects Nb7 when Bf7 blocks its onward route, but allows it with f7 free across D4', () => {
 for(const t of SQUARE_TRANSFORMS) for(const blocked of [true,false]) {
  const fen=transformFen(blocked ? '5K2/5B2/8/N1k5/8/8/8/8 w - - 0 1' : '5K2/8/8/N1k5/8/7B/8/8 w - - 0 1',t);
  const knightMove=getChess(fen).move({from:transformSquare('a5',t),to:transformSquare('b7',t)}).san;
  const kingMove=getChess(fen).move({from:transformSquare('f8',t),to:transformSquare('e7',t)}).san;
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[blocked ? kingMove : knightMove],t.name);
  assert.equal(scoreKnightAndBishopWhiteMove(fen,knightMove).knightDriftObstructionPenalty,blocked ? 2 : 0,t.name);
  if(blocked) assert.equal(explainMove(bishopKnightRuleSet.scoreWhiteCandidates!(fen,getChess(fen).moves()),knightAndBishopWhiteRules,kingMove)?.id,'r7',t.name);
 }
});
