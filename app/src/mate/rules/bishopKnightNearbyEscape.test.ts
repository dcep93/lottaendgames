import assert from 'node:assert/strict';
import test from 'node:test';
import type { Square } from 'chess.js';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

test('r9.1 escapes an attacked bishop, with only the central-king exemption, across reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to, expected] of [
      ['8/8/8/3Bk3/8/8/1K6/N7 w - - 0 1', 'd5', 'a8', -5],
      ['8/8/8/8/2kBK3/8/8/N7 w - - 0 1', 'e4', 'e3', 0],
      ['8/8/8/3Bk3/2K5/8/8/N7 w - - 0 1', 'd5', 'a8', -5],
      // Two steps away is no longer enough to activate the rule.
      ['8/8/4k3/8/2B5/8/1K6/N7 w - - 0 1', 'c4', 'a6', 0],
    ] as const) {
      const fen = transformFen(source, transform);
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).attackedBishopEscapeScore, expected);
    }
  }
});

test('r9.2 prefers king defense only, otherwise distance even when bishop-defended', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.2')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3kN3/6K1/8/8/8/1B6 w - - 0 1', transform);
    const score = (from: Square, to: Square) => scoreKnightAndBishopWhiteMove(fen,
      getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san);
    const kingDefense = score('g5', 'f5');
    const bishopDefense = score('b1', 'f5');
    const farEscape = score('e6', 'g7');
    const nearEscape = score('e6', 'c7');
    assert.equal(kingDefense.attackedKnightDefensePenalty, 0);
    assert.equal(bishopDefense.attackedKnightDefensePenalty, 1);
    assert.equal(bishopDefense.attackedKnightEscapeScore, -1);
    assert.ok(compareScoresByRules(kingDefense, bishopDefense, [rule]) < 0);
    assert.ok(compareScoresByRules(farEscape, bishopDefense, [rule]) < 0);
    assert.ok(compareScoresByRules(kingDefense, farEscape, [rule]) < 0);
    assert.equal(farEscape.attackedKnightEscapeScore, -Math.sqrt(10));
    assert.equal(nearEscape.attackedKnightEscapeScore, -Math.sqrt(2));
    assert.ok(compareScoresByRules(farEscape, nearEscape, [rule]) < 0);
  }
});

test('r9.2 only activates for a knight attacked before White moves', () => {
  const result = scoreKnightAndBishopWhiteMove('7k/8/3N4/8/8/8/8/KB6 w - - 0 1', 'Nf7+');
  assert.equal(result.attackedKnightDefensePenalty, 0);
  assert.equal(result.attackedKnightEscapeScore, 0);
});

test('r9.3 scores only the bishop when both minors start within two king steps', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.3')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('5k2/8/6BN/6K1/8/8/8/8 w - - 0 1', transform);
    const score = (from: Square, to: Square) => scoreKnightAndBishopWhiteMove(fen,
      getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san);
    const bishopEscape = score('g6', 'b1');
    const knightEscape = score('h6', 'f5');
    const kingMove = score('g5', 'f4');
    const best = getChess(fen).move({from: transformSquare('g6', transform), to: transformSquare('b1', transform)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [best]);
    assert.equal(bishopEscape.nearbyPairBishopEscapeScore, -Math.sqrt(65));
    assert.equal(knightEscape.nearbyPairBishopEscapeScore, -Math.sqrt(5));
    assert.equal(compareScoresByRules(knightEscape, kingMove, [rule]), 0);
    assert.ok(compareScoresByRules(bishopEscape, knightEscape, [rule]) < 0);
  }
});

test('r9.3 requires both nearby pieces and exempts either central-king defense before the move', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to, expected] of [
      // Only the bishop is nearby.
      ['N4k2/8/6B1/6K1/8/8/8/8 w - - 0 1', 'g6', 'b1', 0],
      // Only the knight is nearby.
      ['5k2/8/7N/6K1/8/8/8/1B6 w - - 2 2', 'b1', 'a2', 0],
      // Bishop defended by a central king, knight unprotected.
      ['8/4k3/5N2/3B4/4K3/8/8/8 w - - 0 1', 'd5', 'c4', 0],
      // Knight defended by a central king, bishop unprotected.
      ['8/8/4k1B1/5N2/4K3/8/8/8 w - - 0 1', 'g6', 'h7', 0],
      // Both protected before the king moves away.
      ['8/3k4/8/3B1N2/4K3/8/8/8 w - - 0 1', 'e4', 'f3', 0],
      // Having a central king alone does not exempt the minors.
      ['5k2/8/6BN/8/3K4/8/8/8 w - - 0 1', 'g6', 'b1', -Math.sqrt(65)],
    ] as const) {
      const fen = transformFen(source, transform);
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).nearbyPairBishopEscapeScore, expected, source);
    }
  }
});
