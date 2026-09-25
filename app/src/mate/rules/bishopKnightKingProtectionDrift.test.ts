import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {knightKingProtectionDistance} from './bishopKnightStrategy';

test('r10 prefers Nf2 toward White king protection across D4', () => {
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


test('r10 prefers establishing a precage knight over the loaded bishop shuffle across D4', () => {
 const start = '6B1/8/8/5k1K/2N5/8/8/8 w - - 0 1';
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r10')!;
 for (const t of SQUARE_TRANSFORMS) {
  const fen = transformFen(start, t);
  const move = (to: 'd5' | 'f7') => getChess(fen).move({from:transformSquare('g8',t),to:transformSquare(to,t)}).san;
  const precage = scoreKnightAndBishopWhiteMove(fen,move('d5'));
  const away = scoreKnightAndBishopWhiteMove(fen,move('f7'));
  assert.equal(precage.knightTargetProximityScore,0);
  assert.equal(away.knightTargetProximityScore,99);
  assert.ok(rule.compare!(precage,away)<0);
  const kingMoves = (['h6', 'h4'] as const).map(to => getChess(fen).move({from:transformSquare('h5',t),to:transformSquare(to,t)}).san);
  assert.deepEqual(new Set(getIdealKnightAndBishopWhiteMoves(fen)),new Set(kingMoves));
 }
});

test('r10 does not use king protection as a tiebreak once the knight is on precage', () => {
 const fen = '8/3k4/8/3B4/2N2K2/8/8/8 w - - 0 1';
 const near = scoreKnightAndBishopWhiteMove(fen,'Ke4');
 const far = scoreKnightAndBishopWhiteMove(fen,'Kg4');
 assert.equal(near.knightTargetProximityScore,0);
 assert.equal(far.knightTargetProximityScore,0);
 assert.notEqual(near.knightKingProtectionDistance,far.knightKingProtectionDistance);
 const rule = knightAndBishopWhiteRules.find(r => r.id === 'r10')!;
 assert.equal(rule.compare!(near,far),0);
});
