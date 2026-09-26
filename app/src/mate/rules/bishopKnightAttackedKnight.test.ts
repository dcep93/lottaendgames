import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r5.5 prefers king defense of an attacked knight, regardless of bishop defense, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, penalty] of [
      ['KB6/8/2k5/3N4/8/8/8/8 w - - 0 1', 1],
      ['1B1K4/8/2k5/3N4/8/8/8/8 w - - 0 1', 0],
      ['KB6/8/8/k2N4/8/8/8/8 w - - 0 1', 0],
      ['K6B/8/2k5/3N4/8/8/8/8 w - - 0 1', 1],
    ] as const) {
      const fen = transformFen(start, t);
      const move = getChess(fen).move({from: transformSquare('d5', t), to: transformSquare('c7', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).attackedMinorWithoutKingDefensePenalty, penalty, t.name);
      if (penalty) assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes(move), t.name);
    }
  }
});


test('r5.5 prefers king defense of an attacked bishop too, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const [start, penalty] of [
    ['B6K/8/8/1k2N3/8/8/8/8 w - - 0 1', 1], // Knight defense is insufficient.
    ['B7/8/8/1k1KN3/8/8/8/8 w - - 0 1', 0],
    ['B6K/8/8/k3N3/8/8/8/8 w - - 0 1', 0], // Bishop is not attacked.
  ] as const) {
    const fen = transformFen(start, t);
    const move = getChess(fen).move({from: transformSquare('a8', t), to: transformSquare('c6', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).attackedMinorWithoutKingDefensePenalty, penalty, t.name);
  }
});

test('r5.5 credits a king move establishing bishop defense, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/2B5/1k2N3/4K3/8/8/8 w - - 0 1', t);
    const score = (to: 'd5' | 'f4') => scoreKnightAndBishopWhiteMove(fen,
      getChess(fen).move({from: transformSquare('e4', t), to: transformSquare(to, t)}).san);
    assert.equal(score('d5').attackedMinorWithoutKingDefensePenalty, 0, t.name);
    assert.equal(score('f4').attackedMinorWithoutKingDefensePenalty, 1, t.name);
  }
});
