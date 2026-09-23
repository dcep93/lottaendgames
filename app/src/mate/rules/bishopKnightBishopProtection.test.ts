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


test('r17 prefers Be6+ through Black’s king across D4 without changing actual bishop control', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('K1B5/8/8/8/2k5/1N6/8/8 w - - 0 1', t);
    const chess = getChess(fen);
    const move = chess.move({from: transformSquare('c8',t), to: transformSquare('e6',t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen,move).knightBishopProtectionPenalty,0,t.name);
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[move],t.name);
    assert.equal(bishopControlsOrOccupiesSquare(chess.fen(),transformSquare('e6',t),transformSquare('b3',t)),false,t.name);
  }
});
