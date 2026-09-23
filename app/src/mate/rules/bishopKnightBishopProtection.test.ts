import assert from 'node:assert/strict';
import test from 'node:test';
import { bishopControlsOrOccupiesSquare } from './bishopKnightGeometry';
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess';
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove, knightAndBishopWhiteRules } from './bishopKnight';

test('r2.5 prescribes Kb5 in the supported bishop shuttle across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/k7/B7/K2N4/8/8/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('a5',t), to: transformSquare('b5',t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,san).supportedDiagonalSizeScore,3);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san],t.name);
  }
});

test('r17 recognizes bishop defense via either minor and respects blockers across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [fen,from,to,penalty] of [
      ['2B5/6K1/8/4k3/1N6/8/8/8 w - - 0 1','b4','a6',0],
      ['2B5/6K1/8/4k3/1N6/8/8/8 w - - 0 1','b4','c6',1],
      ['2B5/7K/8/3N4/8/7k/8/8 w - - 0 1','c8','b7',0],
      ['B7/8/2K5/3N4/8/7k/8/8 w - - 0 1','c6','b5',0],
      ['B7/8/2K5/3N4/8/7k/8/8 w - - 0 1','c6','b7',1],
    ] as const) {
      const f=transformFen(fen,t);
      const san=getChess(f).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(f,san).knightBishopProtectionPenalty,penalty,`${t.name} ${san}`);
    }
  }
  const ids=knightAndBishopWhiteRules.map(r=>r.id);
  assert.ok(ids.indexOf('r15')<ids.indexOf('r17') && ids.indexOf('r17')<ids.indexOf('r18'));
});


test('r17 credits Be6+ through Black’s king while earlier r9.95 prefers path control, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('K1B5/8/8/8/2k5/1N6/8/8 w - - 0 1', t);
    const chess = getChess(fen);
    const move = chess.move({from: transformSquare('c8',t), to: transformSquare('e6',t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,move).knightBishopProtectionPenalty,0,t.name);
    const nd2 = getChess(fen).move({from:transformSquare('b3',t),to:transformSquare('d2',t)}).san;
    assert.ok(knightAndBishopWhiteRules.find(r=>r.id==='r9.95')!.compare!(
      scoreKnightAndBishopWhiteMove(fen,nd2),scoreKnightAndBishopWhiteMove(fen,move)) < 0);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[nd2],t.name);
    assert.equal(bishopControlsOrOccupiesSquare(chess.fen(),transformSquare('e6',t),transformSquare('b3',t)),false,t.name);
  }
});


test('r17 allows adjacent protection with retreat room and longer protection across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen=transformFen('2k1B2K/8/2N5/8/8/8/8/8 w - - 6 4',t);
    for (const [from,to,penalty] of [['e8','d7',0],['h8','h7',0],['e8','f7',1]] as const) {
      const san=getChess(fen).move({from:transformSquare(from,t),to:transformSquare(to,t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen,san).knightBishopProtectionPenalty,penalty,`${t.name} ${san}`);
    }
  }
});


test('r17 rejects bishops trapped between the knight and the wall across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [source, penalty] of [
      ['B7/1N6/8/8/7k/8/8/7K w - - 0 1', 1],
      ['2B5/1N6/8/8/7k/8/8/7K w - - 0 1', 1],
      ['B7/8/2N5/8/7k/8/8/7K w - - 0 1', 0],
      ['8/1B6/2N5/8/7k/8/8/7K w - - 0 1', 0],
    ] as const) {
      const fen = transformFen(source, t);
      const san = getChess(fen).move({from: transformSquare('h1', t), to: transformSquare('g1', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).knightBishopProtectionPenalty, penalty, `${t.name} ${source}`);
    }
    const blocked = transformFen('1K6/1B6/2N5/8/7k/8/8/8 w - - 0 1', t);
    const san = getChess(blocked).move({from: transformSquare('b8', t), to: transformSquare('a8', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(blocked, san).knightBishopProtectionPenalty, 1, t.name);
  }
});
