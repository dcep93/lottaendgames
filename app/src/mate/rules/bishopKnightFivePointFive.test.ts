import assert from 'node:assert/strict';
import test from 'node:test';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { bishopKnightRuleSet, getIdealKnightAndBishopWhiteMoves } from './bishopKnight';
import { knightAndBishopFivePointFiveMove } from './bishopKnightFivePointFive';

test('r5.5 matches any central Black king for both fixed steps, across D4', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const [source, from, to] of [
      ['8/2K5/2B5/1N2k3/8/8/8/8 w - - 0 1', 'c7', 'd7'],
      ['8/8/8/4k3/N1B5/2K5/8/8 w - - 0 1', 'c3', 'd3'],
    ] as const) {
      for (const black of ['d4', 'e4', 'd5', 'e5'] as const) {
        const c = getChess(source);
        c.remove('e5');
        c.put({color: 'b', type: 'k'}, black);
        const fen = transformFen(c.fen(), transform);
        const move = {from: transformSquare(from, transform), to: transformSquare(to, transform)};
        const legal = getChess(fen).moves({verbose: true}).some(m => m.from === move.from && m.to === move.to);
        assert.equal(knightAndBishopFivePointFiveMove(fen), legal ? move.from + move.to : undefined);
      }
    }
    for (const source of [
      '8/2K5/2B5/1N2k3/8/8/8/8 w - - 0 1',
      '8/2K5/2B5/4k3/8/8/1N6/8 w - - 0 1',
    ]) {
      const fen = transformFen(source, transform);
      const san = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare('d7', transform)}).san;
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], transform.name);
    }
    assert.equal(knightAndBishopFivePointFiveMove(transformFen('8/2KN4/2B5/4k3/8/8/8/8 w - - 0 1', transform)), undefined);
    assert.equal(knightAndBishopFivePointFiveMove(transformFen('8/2K5/2B5/1N3k2/8/8/8/8 w - - 0 1', transform)), undefined);
  }
});

test('r5.5 prefers Kd3 across D4 independently of knight placement', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const source of [
      '8/8/8/4k3/N1B5/2K5/8/8 w - - 0 1',
      'N7/8/8/4k3/2B5/2K5/8/8 w - - 0 1',
      '8/8/8/4k3/2B5/2K5/1N6/8 w - - 0 1',
    ]) {
      const fen = transformFen(source, transform);
      const from = transformSquare('c3', transform), to = transformSquare('d3', transform);
      assert.equal(knightAndBishopFivePointFiveMove(fen), from + to);
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [getChess(fen).move({from, to}).san]);
    }
  }
});

test('r5.5 rejects translations, mismatched pieces and occupied destinations', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const source of [
      '8/8/8/5k2/1N1B4/3K4/8/8 w - - 0 1',
      '8/8/8/5k2/N1B5/2K5/8/8 w - - 0 1',
      '8/8/8/4k3/N1B5/1K6/8/8 w - - 0 1',
      '8/8/8/4k3/N2B4/2K5/8/8 w - - 0 1',
      '8/8/8/4k3/2B5/2KN4/8/8 w - - 0 1',
    ]) assert.equal(knightAndBishopFivePointFiveMove(transformFen(source, transform)), undefined);
  }
});

test('r5.5 diagram shows the prescribed king step and omits the irrelevant knight', () => {
  const board = bishopKnightRuleSet.help.noteBoards?.find(board => board.id === 'bishop-knight-rule-r5-5');
  assert.ok(board);
  assert.deepEqual(board.arrows, [{from: 'c3', to: 'd3'}]);
  assert.deepEqual(board.pieces, [{square: 'c3', piece: 'K'}, {square: 'c4', piece: 'B'}, {square: 'e5', piece: 'k'}]);
});
