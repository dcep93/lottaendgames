import assert from 'node:assert/strict';
import test from 'node:test';
import { allSquares, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopKnightBehindKingProximityScore, knightAndBishopSquaresBehindWhiteKing } from './bishopKnightStrategy';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

test('behind Kd4 against Kg4 means every square on files a–c, including reflections', () => {
  const source = '8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1';
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(source, transform);
    const expected = allSquares().filter(square => 'abc'.includes(square[0]!)).map(square => transformSquare(square, transform));
    assert.deepEqual(knightAndBishopSquaresBehindWhiteKing(fen).sort(), expected.sort());
    assert.equal(knightAndBishopKnightBehindKingProximityScore(fen), 4);
    const board = getChess(fen);
    board.move({ from: transformSquare('g1', transform), to: transformSquare('e2', transform) });
    assert.equal(knightAndBishopKnightBehindKingProximityScore(board.fen()), 2);
  }
});

test('being anywhere behind White counts as zero, without an adjacency requirement', () => {
  const fen = '8/8/8/3B4/3K2k1/8/8/N7 w - - 0 1';
  assert.equal(knightAndBishopKnightBehindKingProximityScore(fen), 0);
});

test('r15 uses Euclidean distance, and recomputes behind after a king move', () => {
  const fen = '8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1';
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r15')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const source = transformFen(fen, transform);
    const move = (from: 'g1' | 'd4', to: 'e2' | 'e5') => getChess(source).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
    const knight = scoreKnightAndBishopWhiteMove(source, move('g1', 'e2'));
    const king = scoreKnightAndBishopWhiteMove(source, move('d4', 'e5'));
    assert.equal(knight.knightBehindKingProximityScore, 2);
    assert.equal(king.knightBehindKingProximityScore, Math.sqrt(17));
    assert.ok(compareScoresByRules(knight, king, [rule]) < 0);
  }
});

test('behind is strict and unavailable when White is backed against the board edge', () => {
  const fen = '8/8/8/3B4/K5k1/8/8/6N1 w - - 0 1';
  assert.deepEqual(knightAndBishopSquaresBehindWhiteKing(fen), []);
  assert.equal(knightAndBishopKnightBehindKingProximityScore(fen), 99);
});

test('r10 ignores precage distances ahead of White, so r15 selects Ne2 in every symmetry', () => {
  const original = '8/8/8/3B4/3K2k1/8/8/6N1 w - - 0 1';
  const r10 = knightAndBishopWhiteRules.find(rule => rule.id === 'r10')!;
  const rank = r10.subpriorities![4]!.rank!;
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(original, transform);
    const move = (from: 'g1' | 'd4', to: 'e2' | 'e5') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
    const knight = scoreKnightAndBishopWhiteMove(fen, move('g1', 'e2'));
    const king = scoreKnightAndBishopWhiteMove(fen, move('d4', 'e5'));
    assert.deepEqual([knight.knightTargetProximityScore, king.knightTargetProximityScore], [4, 3]);
    assert.deepEqual(rank([knight, king]), [99, 99]);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('g1', 'e2')]);
  }
});

test('r10 keeps a sideways knight neutral while still ranking knights behind White', () => {
  const fen = '8/8/8/3B4/3KN1k1/8/8/8 w - - 0 1';
  const sideways = scoreKnightAndBishopWhiteMove(fen, 'Nd6');
  const behind = scoreKnightAndBishopWhiteMove(fen, 'Nc5');
  assert.equal(sideways.knightBehindKingProximityScore, 1);
  assert.equal(behind.knightBehindKingProximityScore, 0);
  const rank = knightAndBishopWhiteRules.find(rule => rule.id === 'r10')!.subpriorities![4]!.rank!;
  assert.deepEqual(rank([sideways, behind]), [behind.knightTargetProximityScore, behind.knightTargetProximityScore]);
  assert.deepEqual(rank([behind]), [behind.knightTargetProximityScore]);
});
