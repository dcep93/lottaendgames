import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r18 prefers control across a shortest king path in every symmetry', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/N7/8/2K5/B3k3/8/8/8 w - - 0 1', t);
    const move = (to: 'b3' | 'e8') => getChess(fen).move({from: transformSquare('a4', t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b3')).bishopKingPathPenalty, 0, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('e8')).bishopKingPathPenalty, 1, t.name);
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move('e8')), t.name);
    // Nc4 blocks Bb3's ray to the intermediate square d5.
    const blocked = transformFen('8/8/8/2K5/B1N1k3/8/8/8 w - - 0 1', t);
    const san = getChess(blocked).move({from: transformSquare('a4', t), to: transformSquare('b3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(blocked, san).bishopKingPathPenalty, 1, t.name);
  }
});
