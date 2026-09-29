import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('temporary r3 minimizes King, Bishop, Knight Euclidean distances lexicographically across D4', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r3')!;
  assert.equal(rule.helpText, "(temporary) Prefer king proximity, then bishop proximity, then knight proximity.");
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/3k4/8/8/8/3K4/N6B w - - 0 1', t);
    const score = (from: 'd2' | 'h1' | 'a1', to: 'c3' | 'd3' | 'g2' | 'b3' | 'c2') => {
      const move = getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)});
      return scoreKnightAndBishopWhiteMove(fen, move.san);
    };
    const king = score('d2', 'd3'), diagonal = score('d2', 'c3');
    const bishop = score('h1', 'g2'), knight = score('a1', 'b3'), farKnight = score('a1', 'c2');
    assert.ok(rule.compare!(king, bishop) < 0, 'king first');
    assert.ok(rule.compare!(bishop, knight) < 0, 'bishop breaks equal king distances');
    assert.ok(rule.compare!(king, knight) < 0, 'king before knight');
    assert.ok(rule.compare!(knight, farKnight) < 0, 'knight breaks equal bishop and king distances');
    assert.ok(rule.compare!(king, diagonal) < 0, 'Euclidean distance breaks equal king-step distances');
    assert.equal(bishop.bishopBlackDistanceSquared, 25);
    assert.equal(king.kingBlackDistanceSquared, 9);
    assert.equal(knight.knightBlackDistanceSquared, 13);
    assert.equal(rule.compare!(king, king), 0);
  }
});
