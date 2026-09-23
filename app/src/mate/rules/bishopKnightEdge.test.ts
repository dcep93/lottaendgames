import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('r18 prefers an interior knight to the former edge shuttle, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/6K1/8/8/8/8/5k2/5N2 w - - 0 1', t);
    const san = (to: 'd2' | 'h2') => getChess(fen).move({from: transformSquare('f1', t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('d2')).knightEdgePenalty, 0, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('h2')).knightEdgePenalty, 1, t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('d2')], t.name);
  }
});
