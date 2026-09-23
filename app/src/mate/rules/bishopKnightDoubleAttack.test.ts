import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

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
