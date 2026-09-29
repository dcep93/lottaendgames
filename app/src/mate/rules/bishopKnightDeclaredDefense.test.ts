import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {declaredKnightDefenseMove} from './bishopKnightDeclaredDefense';
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('exact r4.6 placement prefers Kc5 across D4, independent of clocks', () => {
  for (const source of ['1k6/8/B7/1K6/1N6/8/8/8 w - - 14 8', '8/k7/B7/1K6/1N6/8/8/8 w - - 0 1'])
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(source, transform);
    const san = getChess(fen).move({from: transformSquare('b5', transform), to: transformSquare('c5', transform)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san]);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).knightDefensePenalty, -1);
  }
});

test('exact r4.6 exception does not extend to changed piece placements or Black turn', () => {
  for (const fen of [
    'k7/8/B7/1K6/1N6/8/8/8 w - - 0 1',
    '1k6/8/8/1KB5/1N6/8/8/8 w - - 0 1',
    '1k6/8/B7/1K6/8/2N5/8/8 w - - 0 1',
    '1k6/8/B7/2K5/1N6/8/8/8 w - - 0 1',
    '1k6/8/B7/1K6/1N6/8/8/8 b - - 0 1',
  ]) assert.equal(declaredKnightDefenseMove(fen), undefined);
});
