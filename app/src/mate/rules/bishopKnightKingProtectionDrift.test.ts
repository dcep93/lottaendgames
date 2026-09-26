import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {selectCandidatesByRules} from './selection';

test('a chase with no king rescue or safe onward jump gives no drift credit, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('KB6/8/8/2kN4/8/8/8/8 w - - 0 1', t);
    const san = (to: 'c7' | 'f4') => getChess(fen).move({from: transformSquare('d5', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(move => ({san: move, score: scoreKnightAndBishopWhiteMove(fen, move)}));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('c7')).knightDriftQualifies, false, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('f4')], t.name);
    assert.equal(selection.lastEliminatingRule?.id, 'r20', t.name);
    const r6 = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
    assert.equal(r6.compare!(scoreKnightAndBishopWhiteMove(fen, san('c7')), scoreKnightAndBishopWhiteMove(fen, san('f4'))), 0, t.name);
  }
});

test('drift allows a safe king rescue but respects an occupied rescue square, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, qualifies] of [
      ['3K4/8/8/Nk6/8/7B/8/8 w - - 0 1', true],
      ['2BK4/8/1k6/N7/8/8/8/8 w - - 0 1', false],
    ] as const) {
      const fen = transformFen(start, t);
      const move = getChess(fen).move({from: transformSquare('a5', t), to: transformSquare('b7', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).knightDriftQualifies, qualifies, t.name);
    }
  }
});
