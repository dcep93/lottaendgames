import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {knightKingProtectionDistance} from './bishopKnightStrategy';

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
  assert.equal(candidate.knightDriftObstructionPenalty, 1, t.name);
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


test('r6 leaves drift neutral when an adjacent Black king blocks the way toward White king across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('K7/8/8/7B/2k5/2N5/8/8 w - - 0 1', t);
  const san = (to: 'd1' | 'e4') => getChess(fen).move({from: transformSquare('c3', t), to: transformSquare(to, t)}).san;
  const retreat = scoreKnightAndBishopWhiteMove(fen, san('d1'));
  const toward = scoreKnightAndBishopWhiteMove(fen, san('e4'));
  assert.equal(retreat.knightDriftBlocked, true);
  assert.equal(rule.compare!(retreat, toward), 0);
 }
});


test('r6 rejects Nb8 before the blocked-drift fallback to r7, preferring Nb4 across D4', () => {
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen('6K1/8/Nk6/8/8/8/8/3B4 w - - 0 1', t);
  const san = (to: 'b4' | 'b8') => getChess(fen).move({from: transformSquare('a6', t), to: transformSquare(to, t)}).san;
  const safe = scoreKnightAndBishopWhiteMove(fen, san('b4'));
  const edge = scoreKnightAndBishopWhiteMove(fen, san('b8'));
  assert.equal(safe.knightDriftBlocked, true);
  assert.equal(edge.knightDriftBlocked, true);
  assert.ok(edge.kingKnightDistanceScore < safe.kingKnightDistanceScore);
  assert.ok(rule.compare!(safe, edge) < 0, t.name);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('b4')], t.name);
 }
});
