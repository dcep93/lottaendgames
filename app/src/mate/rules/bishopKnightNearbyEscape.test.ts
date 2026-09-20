import assert from 'node:assert/strict';
import test from 'node:test';
import type { Square } from 'chess.js';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight';
import { compareScoresByRules } from './selection';

test('r9.1 escapes an attacked bishop unless king-adjacent, including knight-defended bishops', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to, expected] of [
      ['8/8/8/3Bk3/8/8/1K6/N7 w - - 0 1', 'd5', 'a8', -5],
      ['8/8/8/8/2kBK3/8/8/N7 w - - 0 1', 'e4', 'e3', 0],
      ['8/8/8/3Bk3/2K5/8/8/N7 w - - 0 1', 'd5', 'a8', 0],
      ['8/8/8/3Bk3/8/2N5/1K6/8 w - - 0 1', 'd5', 'a8', -5],
      // Two steps away is no longer enough to activate the rule.
      ['8/8/4k3/8/2B5/8/1K6/N7 w - - 0 1', 'c4', 'a6', 0],
    ] as const) {
      const fen = transformFen(source, transform);
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).attackedBishopEscapeScore, expected);
    }
  }
});

test('r9.2 prefers only king defense and ties all other responses', () => {
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
    assert.ok(compareScoresByRules(kingDefense, bishopDefense, [rule]) < 0);
    assert.equal(compareScoresByRules(farEscape, bishopDefense, [rule]), 0);
    assert.ok(compareScoresByRules(kingDefense, farEscape, [rule]) < 0);
    assert.equal(compareScoresByRules(farEscape, nearEscape, [rule]), 0);
  }
});

test('r9.2 only activates for a knight attacked before White moves', () => {
  const result = scoreKnightAndBishopWhiteMove('7k/8/3N4/8/8/8/8/KB6 w - - 0 1', 'Nf7+');
  assert.equal(result.attackedKnightDefensePenalty, 0);
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

test('r9.3 prefers establishing central-king defense over bishop escape in every symmetry', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r9.3')!;
  for (const transform of SQUARE_TRANSFORMS) {
    // Loaded move 2: Kd4 newly defends Bd5, while Nd6 remains undefended.
    const fen = transformFen('8/8/3N4/2KB4/5k2/8/8/8 w - - 2 2', transform);
    const move = (from: Square, to: Square) => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
    const defend = scoreKnightAndBishopWhiteMove(fen, move('c5', 'd4'));
    const escape = scoreKnightAndBishopWhiteMove(fen, move('d5', 'a8'));
    assert.equal(defend.nearbyPairCentralDefensePenalty, 0);
    assert.equal(defend.nearbyPairBishopEscapeScore, 0);
    assert.equal(escape.nearbyPairCentralDefensePenalty, 1);
    assert.ok(compareScoresByRules(defend, escape, [rule]) < 0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('c5', 'd4')]);
    // Defending the knight alone also satisfies the confirmed either-piece exemption.
    const knightFen = transformFen('8/8/4k1B1/5N2/3K4/8/8/8 w - - 0 1', transform);
    const kingMove = getChess(knightFen).move({from: transformSquare('d4', transform), to: transformSquare('e4', transform)}).san;
    const knightDefense = scoreKnightAndBishopWhiteMove(knightFen, kingMove);
    assert.equal(knightDefense.nearbyPairCentralDefensePenalty, 0);
    assert.equal(knightDefense.nearbyPairBishopEscapeScore, 0);
  }
});

test('r9.2 is neutral for knights already defended by any White piece, across symmetries', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to] of [
      // Loaded Nd5 is defended by central Kd4 before Nf4.
      ['8/8/3k4/3N4/3KB3/8/8/8 w - - 0 1', 'd5', 'f4'],
      // Noncentral Kc5 also exempts Nd6.
      ['B7/8/3N4/2K1k3/8/8/8/8 w - - 0 1', 'd6', 'b7'],
      // Bishop f5 defends Ne6 even with a remote king.
      ['8/8/3kN3/5B2/8/8/8/K7 w - - 0 1', 'e6', 'g7'],
    ] as const) {
      const fen = transformFen(source, transform);
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      const result = scoreKnightAndBishopWhiteMove(fen, san);
      assert.equal(result.attackedKnightDefensePenalty, 0);
    }
    const fen = transformFen('8/8/3k4/3N4/3KB3/8/8/8 w - - 0 1', transform);
    const san = getChess(fen).move({from: transformSquare('d5', transform), to: transformSquare('f4', transform)}).san;
    assert.ok(getIdealKnightAndBishopWhiteMoves(fen).includes(san));
  }
});

test('r9.3 requires minor adjacency before the move and includes diagonal adjacency', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to, expected] of [
      // Both minors are close to Black, but not to each other.
      ['8/4K3/5N2/3B1k2/8/8/8/8 w - - 0 1', 'd5', 'a8', 0],
      // Becoming adjacent after moving the bishop does not activate the rule.
      ['8/8/5kB1/8/7N/8/8/K7 w - - 0 1', 'g6', 'h5', 0],
      // Diagonal neighbors qualify as well as the existing edge-adjacent case.
      ['8/8/4k1B1/5N2/8/8/8/K7 w - - 0 1', 'g6', 'h7', -Math.sqrt(10)],
    ] as const) {
      const fen = transformFen(source, transform);
      const san = getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).nearbyPairBishopEscapeScore, expected, source);
    }
  }
});

test('r20 uses legal replies rather than geometric distance for next attacks', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // Black e7 is two steps from Nc5, but d6 is controlled by White's king.
    const fen = transformFen('8/3Nk3/8/4K3/8/8/8/3B4 w - - 0 1', transform);
    const san = getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare('c5', transform)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, san);
    assert.equal(score.attackedKnightDefensePenalty, 1);
    assert.equal(score.knightNextAttackPenalty, 0);
  }
});

test('r20 breaks the loaded shuttle even when the knight was not attacked before White moves', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/7N/3k4/8/3KB3/8/8/8 w - - 0 1', transform);
    const move = (to: Square) => getChess(fen).move({from: transformSquare('h7', transform), to: transformSquare(to, transform)}).san;
    const safe = scoreKnightAndBishopWhiteMove(fen, move('g5'));
    const shuttle = scoreKnightAndBishopWhiteMove(fen, move('f8'));
    assert.equal(safe.attackedKnightDefensePenalty, 0);
    assert.equal(shuttle.attackedKnightDefensePenalty, 0);
    assert.equal(safe.knightNextAttackPenalty, 0);
    assert.equal(shuttle.knightNextAttackPenalty, 1);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('g5')]);
  }
});

test('r20 still counts an attack when the knight has king defense', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/3k4/4N3/6K1/8/8/8/1B6 w - - 0 1', transform);
    const san = getChess(fen).move({from: transformSquare('g5', transform), to: transformSquare('f5', transform)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, san);
    assert.equal(score.attackedKnightDefensePenalty, 0);
    assert.equal(score.knightNextAttackPenalty, 1);
  }
});
