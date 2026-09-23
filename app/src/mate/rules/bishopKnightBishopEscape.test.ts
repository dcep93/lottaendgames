import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r10 escapes the loaded nearby bishop in every symmetry', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('1NK5/8/1kB5/8/8/8/8/8 w - - 0 1', transform);
    const move = (to: 'h1' | 'a8') => getChess(fen).move({from: transformSquare('c6', transform), to: transformSquare(to, transform)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('h1')).nearbyBishopEscapeScore, -Math.sqrt(61));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('a8')).nearbyBishopEscapeScore, -Math.sqrt(5));
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('h1')], transform.name);
  }
});

test('r10 checks the two-step range before White moves regardless of king centrality', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [fen, from, to, expected] of [
      // Exactly two steps activates; the escape remains scored beyond the range.
      ['7K/8/5k2/8/4B3/8/N7/8 w - - 0 1', 'e4', 'a8', -Math.sqrt(29)],
      // Three steps does not activate, even when the bishop moves closer.
      ['7K/5k2/8/8/4B3/8/N7/8 w - - 0 1', 'e4', 'd5', 0],
      // A central king no longer exempts the bishop.
      ['8/8/5k2/8/3KB3/8/N7/8 w - - 0 1', 'd4', 'c3', -Math.sqrt(5)],
      // Starting outside the center still activates when the king enters it.
      ['8/8/5k2/8/4B3/2K5/N7/8 w - - 0 1', 'c3', 'd4', -Math.sqrt(5)],
    ] as const) {
      const source = transformFen(fen, transform);
      const san = getChess(source).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(source, san).nearbyBishopEscapeScore, expected);
    }
  }
});
