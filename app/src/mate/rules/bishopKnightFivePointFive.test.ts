import assert from 'node:assert/strict';
import test from 'node:test';
import { squareCoords, squareFromCoordinates, getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves } from './bishopKnight';
import { knightAndBishopFivePointFiveMove } from './bishopKnightFivePointFive';

test('retained 5.5 pattern helper requires the diagonal king offset rather than matching any central Black square, across D4', () => {
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
        assert.equal(knightAndBishopFivePointFiveMove(fen), legal && black === 'e5' ? move.from + move.to : undefined);
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

test('retained 5.5 pattern helper prefers Kd3 across D4 independently of knight placement', () => {
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

test('retained 5.5 pattern helper rejects noncentral Black kings, mismatched pieces and occupied destinations', () => {
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



test('retained 5.5 pattern helper shifts the whole relative arrangement with each central Black square, across D4', () => {
  for (const black of ['d4', 'e4', 'd5', 'e5'] as const) {
    const {file,rank} = squareCoords(black);
    const king = squareFromCoordinates(file-2,rank-2)!;
    const bishop = squareFromCoordinates(file-2,rank-1)!;
    const target = squareFromCoordinates(file-1,rank-2)!;
    const board = getChess('7k/8/8/8/8/8/8/K7 w - - 0 1');
    board.clear();
    board.put({type:'k',color:'b'},black);
    board.put({type:'k',color:'w'},king);
    board.put({type:'b',color:'w'},bishop);
    board.put({type:'n',color:'w'},'h1');
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(board.fen(),transform);
      assert.equal(knightAndBishopFivePointFiveMove(fen),transformSquare(king,transform)+transformSquare(target,transform));
    }
  }
  for (const transform of SQUARE_TRANSFORMS) {
    const loaded = transformFen('8/8/1KB5/4k3/8/8/8/3N4 w - - 2 2',transform);
    assert.equal(knightAndBishopFivePointFiveMove(loaded),undefined);
    const kc5 = getChess(loaded).move({from:transformSquare('b6',transform),to:transformSquare('c5',transform)}).san;
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(loaded),[kc5]);
    assert.equal(knightAndBishopFivePointFiveMove(transformFen('8/8/1KB5/8/3k4/8/8/3N4 w - - 2 2',transform)),
      transformSquare('b6',transform)+transformSquare('b5',transform));
  }
});
