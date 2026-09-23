import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

test('r8 breaks the central king shuffle by bringing the bishop to d5 in all symmetries', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/8/5k2/3K4/8/8/5N2 w - - 0 1', transform);
    const san = getChess(fen).move({from: transformSquare('a8', transform), to: transformSquare('d5', transform)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], transform.name);
  }
});

test('r8 uses starting king centrality and advances the knight toward a precage square', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r8')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const score = (fen: string, from: 'd4' | 'c3' | 'f1', to: 'c3' | 'd4' | 'd2' | 'h2') => {
      const source = transformFen(fen, transform);
      const san = getChess(source).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      return scoreKnightAndBishopWhiteMove(source, san);
    };
    assert.equal(rule.applies!(score('B7/8/7k/8/3K4/8/8/5N2 w - - 0 1', 'd4', 'c3')), true);
    assert.equal(rule.applies!(score('B7/8/7k/8/8/2K5/8/5N2 w - - 0 1', 'c3', 'd4')), false);
    const fen = '8/8/7k/3B4/3K4/8/8/5N2 w - - 0 1';
    assert.ok(compareScoresByRules(score(fen, 'f1', 'd2'), score(fen, 'f1', 'h2'), [rule]) < 0, transform.name);
  }
});
