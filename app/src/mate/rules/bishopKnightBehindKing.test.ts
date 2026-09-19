import assert from 'node:assert/strict';
import test from 'node:test';
import { allSquares, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopMinorPiecesBehindKingProximityScore as proximity, knightAndBishopSquaresBehindWhiteKing } from './bishopKnightStrategy';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

test('behind Kd4 against Kg4 means files a–c, without an adjacency requirement, in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/B7/8/8/3K2k1/8/8/6N1 w - - 0 1', transform);
    const expected = allSquares().filter(square => 'abc'.includes(square[0]!)).map(square => transformSquare(square, transform));
    assert.deepEqual(knightAndBishopSquaresBehindWhiteKing(fen).sort(), expected.sort());
    assert.equal(proximity(fen), 4); // Ba7 is already behind; Ng1 is four files away.
    const board = getChess(fen);
    board.move({ from: transformSquare('g1', transform), to: transformSquare('e2', transform) });
    assert.equal(proximity(board.fen()), 2);
  }
});

test('r9 sums bishop and knight Euclidean proximity in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(proximity(transformFen('8/5B2/8/8/3K2k1/8/8/7N w - - 0 1', transform)), 8);
    // Both pieces are behind, though neither is adjacent to White.
    assert.equal(proximity(transformFen('8/B7/8/8/3K2k1/8/8/1N6 w - - 0 1', transform)), 0);
  }
});

test('each minor protected by a central White king is exempt, including diagonally, in every symmetry', () => {
  for (const [fen, expected] of [
    ['8/4k3/5N2/3B4/4K3/8/8/8 w - - 0 1', 3], // Protected Bd5 exempt; Nf6 not exempt.
    ['8/4k2B/8/5N2/4K3/8/8/8 w - - 0 1', 4], // Protected Nf5 exempt; Bh7 not exempt.
    ['8/4k3/8/3B1N2/4K3/8/8/8 w - - 0 1', 0], // Both protected.
    ['8/4k3/8/8/3B1N2/4K3/8/8 w - - 0 1', 4], // Noncentral king protects both; neither exempt.
    ['8/4k3/8/5B2/4K3/7N/8/8 w - - 0 1', 0], // King protects B, which protects N; N already behind.
  ] as const) for (const transform of SQUARE_TRANSFORMS) {
    assert.equal(proximity(transformFen(fen, transform)), expected, fen);
  }
  // Knight protection alone does not exempt a bishop ahead of White.
  assert.equal(proximity('8/4k3/4N3/6B1/4K3/8/8/8 w - - 0 1'), 5);
  // Bishop protection alone does not exempt a knight ahead of White.
  assert.equal(proximity('8/4k3/5B2/8/4K2N/8/8/8 w - - 0 1'), 4);
});

test('r9 recomputes the behind region and central-king protection after White moves', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r9')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1', transform);
    const move = (from: 'g1' | 'd4', to: 'e2' | 'e5') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
    const knight = scoreKnightAndBishopWhiteMove(fen, move('g1', 'e2'));
    const king = scoreKnightAndBishopWhiteMove(fen, move('d4', 'e5'));
    assert.equal(knight.minorPiecesBehindKingProximityScore, 2);
    assert.equal(king.minorPiecesBehindKingProximityScore, Math.sqrt(17));
    assert.ok(compareScoresByRules(knight, king, [rule]) < 0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('g1', 'e2')]);
  }
  const fen = '8/4k3/8/5N2/4K3/2B5/8/8 w - - 0 1';
  assert.equal(proximity(fen), 0);
  assert.ok(scoreKnightAndBishopWhiteMove(fen, 'Kf3').minorPiecesBehindKingProximityScore > 0);
});

test('behind is strict; an empty board region penalizes both minors equally', () => {
  const fen = '8/8/8/3B4/K5k1/8/8/6N1 w - - 0 1';
  assert.deepEqual(knightAndBishopSquaresBehindWhiteKing(fen), []);
  assert.equal(proximity(fen), 198);
});

test('r10 ranks precage distances without checking whether the knight is behind White', () => {
  const rank = knightAndBishopWhiteRules.find(rule => rule.id === 'r10')!.subpriorities![4]!.rank!;
  const fen = '8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1';
  const knight = scoreKnightAndBishopWhiteMove(fen, 'Ne2');
  const king = scoreKnightAndBishopWhiteMove(fen, 'Ke5');
  assert.deepEqual(rank([knight, king]), [4, 3]);
});
