import assert from 'node:assert/strict';
import test from 'node:test';
import type { Square } from 'chess.js';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
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

test('r9.2 prefers king or bishop defense, then distance only among undefended outcomes', () => {
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
    assert.equal(bishopDefense.attackedKnightDefensePenalty, 0);
    assert.equal(compareScoresByRules(kingDefense, bishopDefense, [rule]), 0);
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
