import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {protectedCentralManeuverTargets as targets} from './bishopKnightProtectedManeuver';
import {isMiddle16Square} from './bishopKnightGeometry';
import {getIdealKnightAndBishopWhiteMoves as preferred} from './bishopKnight';

test('protected routing stays in the central 16 around a central-four king', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const cases = [
      ['8/8/8/1k6/4KN2/7B/8/8 w - - 0 1', 'd3'],
      ['8/8/8/1k6/4K3/3N3B/8/8 w - - 0 1', 'e5'],
      // The bishop blocks d3, so route around the other side of the king.
      ['8/8/8/1k6/4KN2/3B4/8/8 w - - 0 1', 'd5'],
    ] as const;
    for (const [fen, destination] of cases) {
      const actual = targets(transformFen(fen, t));
      assert.deepEqual(actual, [transformSquare(destination, t)]);
      assert.ok(actual.every(isMiddle16Square));
    }
  }
});

test('protected routing waits for centralization and stops at its central target', () => {
  for (const fen of [
    '8/8/8/8/2k1N3/4K3/8/7B w - - 0 1',
    '8/8/8/8/2k1N3/4KB2/8/8 w - - 0 1',
    '8/8/8/8/2k5/4K3/8/1N5B w - - 0 1',
    '8/8/8/1k2N3/4K3/7B/8/8 w - - 0 1',
  ]) for (const t of SQUARE_TRANSFORMS) assert.deepEqual(targets(transformFen(fen, t)), []);
});

test('the four losing r4 maneuvers yield to winning king centralization across D4', () => {
  const cases = [
    ['8/8/8/8/2N5/2K5/8/1k1B4 w - - 0 1', 'Kd4'],
    ['8/8/8/8/8/k2KN3/8/1B6 w - - 0 1', 'Kd4'],
    ['8/8/8/8/8/1k1KN3/8/1B6 w - - 0 1', 'Kd4'],
    ['8/8/8/8/3N4/3K4/8/2k1B3 w - - 0 1', 'Ke4'],
  ];
  for (const [fen, san] of cases) for (const t of SQUARE_TRANSFORMS) {
    const move = getChess(fen).move(san);
    const reflected = transformFen(fen, t);
    assert.deepEqual(targets(reflected), []);
    const expected = getChess(reflected).move({from:transformSquare(move.from,t), to:transformSquare(move.to,t)}).san;
    assert.deepEqual(preferred(reflected), [expected]);
  }
});
