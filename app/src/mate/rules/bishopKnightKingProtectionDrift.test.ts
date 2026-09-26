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
    // Resulting proximity now lets r6 select Nc7 before the drift rule runs.
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('c7')], t.name);
    assert.equal(selection.lastEliminatingRule?.id, 'r6', t.name);
    const r6 = knightAndBishopWhiteRules.find(r => r.id === 'r6')!;
    assert.ok(r6.subpriorities![0]!.compare!(scoreKnightAndBishopWhiteMove(fen, san('c7')), scoreKnightAndBishopWhiteMove(fen, san('f4'))) < 0, t.name);
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


test('r7 centralizes an already king-protected knight without requiring closer king distance, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('4B3/8/8/4k2N/6K1/8/8/8 w - - 0 1', t);
    const move = getChess(fen).move({from: transformSquare('h5', t), to: transformSquare('f4', t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.kingKnightAdjacencyPenalty, 0, t.name);
    assert.equal(score.knightMiddle16ProximityScore, 0, t.name);
    assert.equal(score.knightDriftQualifies, true, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [move], t.name);
    assert.equal(selection.lastEliminatingRule?.id, 'r7', t.name);
  }
});


test('r7 permits double opposition behind a diagonal blocker, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('2BK4/8/8/8/2k5/1N6/8/8 w - - 2 2', t);
    const move = getChess(fen).move({from: transformSquare('b3', t), to: transformSquare('c1', t)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    // r7 permits Nc1; r4.5 rejects Be6 because it is still within two steps of Kd8.
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules.filter(r => r.id === 'r7')).idealCandidates.map(c => c.san), [move], t.name);
    const bishop = getChess(fen).move({from: transformSquare('c8', t), to: transformSquare('e6', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishop).bishopMoveNearNoncentralKingPenalty, 1, t.name);
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move], t.name);
    for (const quiet of ['2B5/8/8/8/2k5/1N6/8/K7 w - - 2 2', '2BK4/8/8/8/3k4/1N6/8/8 w - - 2 2']) {
      const position = transformFen(quiet, t);
      const retreat = getChess(position).move({from: transformSquare('b3', t), to: transformSquare('c1', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(position, retreat).knightDriftQualifies, false, t.name);
    }
  }
});


test('r7 detours via Na4 when c8 is occupied, then brings the knight closer with Nb2, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, from, to] of [
      ['2B5/8/1N6/2k5/8/4K3/8/8 w - - 2 2', 'b6', 'a4'],
      ['2B5/8/8/8/Nk6/4K3/8/8 w - - 4 3', 'a4', 'b2'],
    ] as const) {
      const fen = transformFen(start, t);
      const move = getChess(fen).move({from: transformSquare(from, t), to: transformSquare(to, t)}).san;
      const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
      const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
      assert.deepEqual(selection.idealCandidates.map(c => c.san), [move], t.name);
      assert.equal(selection.lastEliminatingRule?.id, 'r7', t.name);
    }
    const open = transformFen('8/8/1N6/2k5/8/4K3/8/6B1 w - - 2 2', t);
    const opposition = getChess(open).move({from: transformSquare('b6', t), to: transformSquare('c8', t)}).san;
    const detour = getChess(open).move({from: transformSquare('b6', t), to: transformSquare('a4', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(open, opposition).knightDoubleOpposition, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(open, detour).knightDriftQualifies, false, t.name);
  }
});


test('r6 defers to r7 double opposition when Black is diagonally between knight and king, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7K/8/8/4k3/3N4/8/8/5B2 w - - 2 2', t);
    const move = (to: 'b5' | 'e2' | 'c6') => getChess(fen).move({from: transformSquare('d4', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const r6 = knightAndBishopWhiteRules.find(rule => rule.id === 'r6')!;
    assert.equal(r6.subpriorities![0]!.when!(candidates.map(c => c.score)), false, t.name);
    for (const to of ['b5', 'e2'] as const) assert.equal(scoreKnightAndBishopWhiteMove(fen, move(to)).knightDoubleOpposition, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c6')).knightDriftQualifies, false, t.name);
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san).sort(), [move('b5'), move('e2')].sort(), t.name);
  }
});
