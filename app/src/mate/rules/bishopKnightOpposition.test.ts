import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { firstDifferingRule } from './selection';

test('r9.5 favors opposition behind the bishop, with r9.1 already preferring its king defense', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1N6/8/8/8/4K3/5Bk1/8/8 w - - 0 1', transform);
    const san = getChess(fen).move({ from: transformSquare('e4', transform), to: transformSquare('e3', transform) }).san;
    const escape = getChess(fen).move({ from: transformSquare('f3', transform), to: transformSquare('h1', transform) }).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], transform.name);
    const king = scoreKnightAndBishopWhiteMove(fen, san), bishop = scoreKnightAndBishopWhiteMove(fen, escape);
    assert.equal(king.bishopOppositionPenalty, 0);
    assert.equal(bishop.bishopOppositionPenalty, 1);
    assert.equal(firstDifferingRule(king, bishop, knightAndBishopWhiteRules)?.id, 'r9.1');
  }
});

test('r9.5 requires the source color and edge adjacency, with an on-board target', () => {
  for (const source of [
    '1N6/8/8/8/8/4KBk1/8/8 w - - 0 1',
    '1N6/8/8/6k1/4K3/5B2/8/8 w - - 0 1',
    '1N6/8/8/8/4K3/6kB/8/8 w - - 0 1',
  ]) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(source, transform);
      for (const san of getChess(fen).moves())
        assert.equal(scoreKnightAndBishopWhiteMove(fen, san).bishopOppositionPenalty, 0, `${fen}: ${san}`);
    }
  }
});

test('r9.5 ties candidates when opposition cannot be taken in one legal king move', () => {
  for (const source of [
    '8/8/8/8/4K3/4NBk1/8/8 w - - 0 1',
    'KN6/8/8/8/8/5Bk1/8/8 w - - 0 1',
  ]) {
    const penalties = getChess(source).moves().map(san => scoreKnightAndBishopWhiteMove(source, san).bishopOppositionPenalty);
    assert.ok(penalties.length > 1);
    assert.equal(new Set(penalties).size, 1);
  }
});
