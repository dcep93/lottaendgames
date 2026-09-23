import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r9.8 allows Nc4 defended by an off-edge bishop, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const source = transformFen('8/8/8/Nk6/8/1B6/8/K7 w - - 2 2', t);
    const move = {from: transformSquare('a5', t), to: transformSquare('c4', t)};
    const san = getChess(source).move(move).san;
    assert.equal(scoreKnightAndBishopWhiteMove(source, san).bothMinorsNextAttackPenalty, 0, t.name);
    // An edge bishop's defense does not qualify for this exception.
    const edge = transformFen('8/8/8/8/k2N4/8/B7/7K w - - 2 2', t);
    const edgeMove = getChess(edge).move({from: transformSquare('d4', t), to: transformSquare('b3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(edge, edgeMove).bothMinorsNextAttackPenalty, 1, t.name);
    // Merely being off the edge is insufficient without defending the knight.
    const noDefense = transformFen('8/8/8/N7/1k6/8/1B6/7K w - - 2 2', t);
    assert.equal(scoreKnightAndBishopWhiteMove(noDefense, getChess(noDefense).move(move).san).bothMinorsNextAttackPenalty, 1, t.name);
  }
});

test('r9.8 allows Nc5 when White’s king defends the knight, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const source = '8/1N6/B1k5/8/3K4/8/8/8 w - - 0 1';
    const fen = transformFen(source, t);
    const move = {from: transformSquare('b7', t), to: transformSquare('c5', t)};
    const san = getChess(fen).move(move).san;
    // Kb5 approaches both minors, but Kd4 protects Nc5.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).bothMinorsNextAttackPenalty, 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
    // Without king defense, the same double attack is penalized.
    const undefended = transformFen('8/1N6/B1k5/8/8/3K4/8/8 w - - 0 1', t);
    assert.equal(scoreKnightAndBishopWhiteMove(undefended, getChess(undefended).move(move).san).bothMinorsNextAttackPenalty, 1, t.name);
  }
});

test('r9.8 rejects the loop return allowing Kb6 to attack both minors, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2N5/2BK4/k7/8/8/8/8 w - - 0 1', t);
    const move = (to: 'e5' | 'c5') => getChess(fen).move({from: transformSquare('d6', t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('e5')).bothMinorsNextAttackPenalty, 1);
    // Kc5 makes the apparent double-attack square b6 illegal for Black.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c5')).bothMinorsNextAttackPenalty, 0);
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move('e5')), t.name);
  }
});

test('r9.8 requires both pieces to be attacked by the same legal reply', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7K/8/8/3k4/8/1B4N1/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('h8', t), to: transformSquare('g8', t)}).san;
    // The minor pieces are too far apart for a single king square to attack both.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).bothMinorsNextAttackPenalty, 0);
  }
});


test('r9.8 allows Nb6 when White’s king already defends the bishop, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const score = (source: string) => {
      const fen = transformFen(source, t);
      const san = getChess(fen).move({from: transformSquare('a4', t), to: transformSquare('b6', t)}).san;
      return scoreKnightAndBishopWhiteMove(fen, san);
    };
    // Kc5 can approach both Bd5 and Nb6, but Ke5 already protects the bishop.
    assert.equal(score('8/8/8/3BK3/Nk6/8/8/8 w - - 2 2').bothMinorsNextAttackPenalty, 0, t.name);
    const loaded = transformFen('8/8/8/3BK3/Nk6/8/8/8 w - - 2 2', t);
    const nb6 = getChess(loaded).move({from: transformSquare('a4', t), to: transformSquare('b6', t)}).san;
    assert.ok(getIdealKnightAndBishopWhiteMoves(loaded).includes(nb6), t.name);
    // Moving White’s king away restores the same double-attack threat.
    assert.equal(score('8/8/5K2/3B4/Nk6/8/8/8 w - - 2 2').bothMinorsNextAttackPenalty, 1, t.name);
  }
});
