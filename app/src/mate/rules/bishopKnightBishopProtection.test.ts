import assert from 'node:assert/strict';
import test from 'node:test';
import { bishopControlsOrOccupiesSquare } from './bishopKnightGeometry';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight';

test('stable bishop protection metric recognizes bishop defense via either minor and respects blockers across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [fen,from,to,penalty] of [
      ['2B5/6K1/8/4k3/1N6/8/8/8 w - - 0 1','b4','a6',2],
      ['2B5/6K1/8/4k3/1N6/8/8/8 w - - 0 1','b4','c6',2],
      ['2B5/7K/8/3N4/8/7k/8/8 w - - 0 1','c8','b7',2],
      ['B7/8/2K5/3N4/8/7k/8/8 w - - 0 1','c6','b5',2],
      ['B7/8/2K5/3N4/8/7k/8/8 w - - 0 1','c6','b7',99],
    ] as const) {
      const f=transformFen(fen,t);
      const san=getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(f,san).knightBishopProtectionPenalty,penalty,`${t.name} ${san}`);
    }
  }
});


test('stable bishop protection metric credits Be6+ through Black’s king across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('K1B5/8/8/8/2k5/1N6/8/8 w - - 0 1', t);
    const chess = getChess(fen);
    const move = chess.move({from: transformSquare('c8',t), to: transformSquare('e6',t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,move).knightBishopProtectionPenalty,0,t.name);
    assert.equal(bishopControlsOrOccupiesSquare(chess.fen(),transformSquare('e6',t),transformSquare('b3',t)),false,t.name);
  }
});


test('stable bishop protection metric allows adjacent protection with retreat room and longer protection across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen=transformFen('2k1B2K/8/2N5/8/8/8/8/8 w - - 6 4',t);
    for (const [from,to,penalty] of [['e8','d7',0],['h8','h7',0],['e8','f7',2]] as const) {
      const san=getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen,san).knightBishopProtectionPenalty,penalty,`${t.name} ${san}`);
    }
  }
});


test('stable bishop protection metric excludes edge-adjacent targets and squares too far from Black across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [source, penalty] of [
      ['B7/1N6/8/8/7k/8/8/7K w - - 0 1', 4],
      ['2B5/1N6/8/8/7k/8/8/7K w - - 0 1', 2],
      ['B7/8/2N5/8/7k/8/8/7K w - - 0 1', 2],
      ['8/1B6/2N5/8/7k/8/8/7K w - - 0 1', 2],
    ] as const) {
      const fen = transformFen(source, t);
      const san = getChess(fen).move({from: transformSquare('h1', t), to: transformSquare('g1', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).knightBishopProtectionPenalty, penalty, `${t.name} ${source}`);
    }
    const blocked = transformFen('1K6/1B6/2N5/8/7k/8/8/8 w - - 0 1', t);
    const san = getChess(blocked).move({from: transformSquare('b8', t), to: transformSquare('a8', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(blocked, san).knightBishopProtectionPenalty, 2, t.name);
  }
});

test('stable bishop protection metric measures knight moves to protected squares across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/8/8/8/7k/8/2N5/7K w - - 0 1', t);
    const score = (from: 'a8' | 'c2' | 'h1', to: 'e4' | 'b4' | 'a3' | 'g1') => {
      const san = getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
      return scoreKnightAndBishopWhiteMove(fen,san);
    };
    const on = score('a8','e4'), one = score('c2','b4'), two = score('h1','g1'), three = score('c2','a3');
    assert.deepEqual([on,one,two,three].map(s=>s.knightBishopProtectionPenalty),[2,3,2,3]);
    const loaded = transformFen('8/8/B7/1K6/3k4/3N4/8/8 w - - 0 1',t);
    const far = (to: 'b4' | 'e1') => {
      const san = getChess(loaded).move({from:transformSquare('d3',t),to:transformSquare(to,t)}).san;
      return scoreKnightAndBishopWhiteMove(loaded,san);
    };
    assert.equal(far('b4').knightBishopProtectionPenalty,99);
    assert.equal(far('e1').knightBishopProtectionPenalty,99);
  }
});


test('stable protection and king adjacency break the recorded shuttles across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, from, to] of [
      ['3K4/8/2Nk4/8/B7/8/8/8 w - - 0 1', 'c6', 'e7'],
      ['8/3B4/3k4/8/1K6/1N6/8/8 w - - 0 1', 'd7', 'b5'],
    ] as const) {
      const fen = transformFen(start, t);
      const san = getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san], t.name);
    }
  }
});
