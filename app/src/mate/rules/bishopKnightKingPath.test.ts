import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r9.95 gates on source king distance while r9.96 remains independent, across D4', () => {
  const path = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.95')!;
  const diagonal = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.96')!;
  for (const t of SQUARE_TRANSFORMS) {
    const score = (source: string, from: 'h8' | 'c6', to: 'g8' | 'd5' | 'e8') => {
      const fen = transformFen(source, t);
      return scoreKnightAndBishopWhiteMove(fen, getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san);
    };
    // Moving closer does not activate the rule mid-move.
    assert.equal(path.applies!(score('7K/8/N3k3/8/8/8/8/7B w - - 0 1', 'h8', 'g8')), false);
    assert.equal(path.applies!(score('7K/8/N4k2/8/8/8/8/7B w - - 0 1', 'h8', 'g8')), true);
    const distant = '7K/8/N1B5/8/8/4k3/8/8 w - - 0 1';
    const long = score(distant, 'c6', 'd5');
    const off = score(distant, 'c6', 'e8');
    assert.equal(path.applies!(long), false);
    assert.equal(diagonal.applies, undefined);
    assert.ok(diagonal.compare!(long, off) < 0);
  }
});

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


test('r9.96 prefers long-diagonal occupation after r9.95 path qualification across D4', () => {
  const compare = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.95')!.compare!;
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/2K5/N1B1k3/8/8/8 w - - 2 2', t);
    const move = (from: 'c4' | 'a4', to: 'd5' | 'b2') => getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
    const bishop = scoreKnightAndBishopWhiteMove(fen, move('c4', 'd5'));
    const knight = scoreKnightAndBishopWhiteMove(fen, move('a4', 'b2'));
    assert.equal(bishop.bishopKingPathPenalty, 0, t.name);
    assert.equal(knight.bishopKingPathPenalty, 0, t.name);
    assert.equal(bishop.bishopLongDiagonalPenalty, 0, t.name);
    assert.equal(knight.bishopLongDiagonalPenalty, 1, t.name);
    assert.equal(compare(bishop, knight), 0, t.name);
    assert.ok(knightAndBishopWhiteRules.find(rule => rule.id === 'r9.96')!.compare!(bishop, knight) < 0, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('c4', 'd5')], t.name);

    // Occupation still outranks a long-diagonal bishop that only controls the path.
    const priorityFen = transformFen('7N/4k3/4B3/5K2/8/8/8/8 w - - 4 3', t);
    const score = (from: 'h8' | 'e6', to: 'f7' | 'd5') => {
      const san = getChess(priorityFen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
      return scoreKnightAndBishopWhiteMove(priorityFen, san);
    };
    assert.ok(compare(score('h8', 'f7'), score('e6', 'd5')) < 0, t.name);
  }
});
