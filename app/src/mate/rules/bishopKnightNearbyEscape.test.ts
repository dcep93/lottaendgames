import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

const loaded = '5k2/8/6BN/6K1/8/8/8/8 w - - 2 2';

test('r9 maximizes both eligible pieces’ Euclidean distances beyond two steps in every symmetry', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r9')!;
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loaded, transform);
    const move = (from: 'g6' | 'h6' | 'g5', to: 'b1' | 'f5' | 'f4') =>
      getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
    const bishop = scoreKnightAndBishopWhiteMove(fen, move('g6', 'b1'));
    const knight = scoreKnightAndBishopWhiteMove(fen, move('h6', 'f5'));
    const king = scoreKnightAndBishopWhiteMove(fen, move('g5', 'f4'));
    assert.equal(bishop.nearbyMinorEscapeScore, -(Math.sqrt(65) + Math.sqrt(8)));
    assert.equal(knight.nearbyMinorEscapeScore, -(Math.sqrt(5) + 3));
    assert.equal(king.nearbyMinorEscapeScore, -(Math.sqrt(5) + Math.sqrt(8)));
    assert.ok(compareScoresByRules(bishop, knight, [rule]) < 0);
    assert.ok(compareScoresByRules(knight, king, [rule]) < 0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('g6', 'b1')]);
  }
});

test('r9 eligibility and central-king protection are measured before White moves', () => {
  // Both minors start protected by the central king; moving that king does not activate r9 mid-turn.
  const protectedFen = '8/3k4/8/3B1N2/4K3/8/8/8 w - - 0 1';
  assert.equal(scoreKnightAndBishopWhiteMove(protectedFen, 'Kf3').nearbyMinorEscapeScore, 0);
  // A knight starting farther than two steps gets no new escape credit by entering the range.
  assert.equal(scoreKnightAndBishopWhiteMove('7k/8/3N4/8/8/8/8/KB6 w - - 0 1', 'Nf7+').nearbyMinorEscapeScore, 0);
  // Only the nearby bishop is scored; moving the remote knight does not help.
  assert.equal(scoreKnightAndBishopWhiteMove('N4k2/8/6B1/8/8/8/8/K7 w - - 0 1', 'Nb6').nearbyMinorEscapeScore, -Math.sqrt(5));
});

test('r9 exempts each piece only for central-king defense, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to, expected] of [
      // Central king protects Bd5; remote Nf6 must still escape Black Ke7.
      ['8/4k3/5N2/3B4/4K3/8/8/8 w - - 0 1', 'd5', 'c4', -Math.sqrt(2)],
      // Central king protects Nf5; Bg6 remains eligible against Ke6.
      ['8/8/4k1B1/5N2/4K3/8/8/8 w - - 0 1', 'f5', 'h4', -2],
      // Noncentral king defense does not exempt Bg5 from escaping Kg7.
      ['8/6k1/8/6B1/5K2/8/8/N7 w - - 0 1', 'a1', 'b3', -2],
      // Knight defense does not exempt Bc6 from escaping Ke8.
      ['4k3/8/2B5/4N3/4K3/8/8/8 w - - 0 1', 'e5', 'd3', -Math.sqrt(8)],
    ] as const) {
      const fen = transformFen(source, transform);
      const move = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).nearbyMinorEscapeScore, expected, `${source}: ${move}`);
    }
  }
});
