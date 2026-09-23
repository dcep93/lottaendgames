import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r9.95 prefers control across a shortest Manhattan path in every symmetry', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/N7/8/2K5/B3k3/8/8/8 w - - 0 1', t);
    const move = (to: 'b3' | 'e8') => getChess(fen).move({from: transformSquare('a4', t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b3')).bishopKingPathPenalty, 1, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('e8')).bishopKingPathPenalty, 2, t.name);
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move('e8')), t.name);
    // Nc4 blocks Bb3's ray to d5, between kings on d6 and d3.
    const blocked = transformFen('8/8/3K4/8/2N5/3k4/B7/8 w - - 0 1', t);
    const san = getChess(blocked).move({from: transformSquare('a2', t), to: transformSquare('b3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(blocked, san).bishopKingPathPenalty, 2, t.name);
  }
});


test('r9.95 prefers occupation over control in the loaded placement across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7N/4k3/4B3/5K2/8/8/8/8 w - - 4 3', t);
    const knight = getChess(fen).move({from: transformSquare('h8', t), to: transformSquare('f7', t)}).san;
    const bishop = getChess(fen).move({from: transformSquare('e6', t), to: transformSquare('d5', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, knight).bishopKingPathPenalty, 0, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishop).bishopKingPathPenalty, 1, t.name);
  }
});


test('r9.95 keeps the bishop between the kings before r10 can force its escape', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7N/8/5K2/5B2/5k2/8/8/8 w - - 2 2', t);
    const nf7 = getChess(fen).move({from: transformSquare('h8', t), to: transformSquare('f7', t)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [nf7], t.name);
  }
});


test('r9.95 includes orthogonal detours on Manhattan paths and rejects the loaded Ba4 retreat', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/4k3/8/1BK5/N7/8 w - - 2 2', t);
    const move = (from: 'b3' | 'a2', to: 'c4' | 'a4' | 'b4') => getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
    // c4 lies on a shortest Manhattan c3–e5 path, but not a shortest king-step path.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b3', 'c4')).bishopKingPathPenalty, 0, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('a2', 'b4')).bishopKingPathPenalty, 1, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b3', 'a4')).bishopKingPathPenalty, 2, t.name);
    assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move('b3', 'a4')), t.name);
  }
});
