import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove, knightAndBishopWhiteRules} from './bishopKnight';
import {bishopCentralPathDistances} from './bishopKnightBishopPath';

const loaded = '8/8/8/8/1K6/2Nk4/8/7B w - - 0 1';
test('r6.4 uses the bishop to break the loaded king shuffle across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loaded, transform);
    const move = getChess(fen).move({from: transformSquare('h1', transform), to: transformSquare('e4', transform)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move]);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).bishopCentralPathDistance, 0);
    const shuffle = getChess(fen).move({from: transformSquare('b4', transform), to: transformSquare('b3', transform)}).san;
    assert.ok(scoreKnightAndBishopWhiteMove(fen, shuffle).bishopCentralPathDistance > 0);
  }
});

test('r6.4 replaces the old opposition move with bishop control', () => {
  const fen = '8/7B/8/8/8/1k6/1N6/2K5 w - - 0 1';
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), ['Bg8+']);
  assert.ok(!getIdealKnightAndBishopWhiteMoves(fen).includes('Kb1'));
});

test('r6.4 becomes inactive when Black releases a central king step', () => {
  const board = getChess(loaded);
  board.move('Be4+'); board.move('Kd4');
  assert.ok(bishopCentralPathDistances(board.fen()).size > 0);
  assert.deepEqual(getIdealKnightAndBishopWhiteMoves(board.fen()), ['Bf5']);
  board.move('Bf5'); board.move('Ke5');
  assert.ok(board.moves().includes('Kc4'));
  assert.equal(bishopCentralPathDistances(board.fen()).size, 0);
});

test('r6.4 does not activate for an already central king or an open path', () => {
  for (const fen of [
    '7B/8/8/8/3K4/2N5/6k1/8 w - - 0 1',
    '7B/8/8/8/1K6/2N5/6k1/8 w - - 0 1',
  ]) assert.equal(bishopCentralPathDistances(fen).size, 0);
  const ids = knightAndBishopWhiteRules.map(rule => rule.id);
  assert.ok(ids.indexOf('r6.3') < ids.indexOf('r6.4') && ids.indexOf('r6.4') < ids.indexOf('r7.1'));
});
