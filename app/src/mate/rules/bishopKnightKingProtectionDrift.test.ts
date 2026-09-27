import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {selectCandidatesByRules} from './selection';

test('an onward jump outranked by double opposition cannot justify a drift, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/2N5/8/8/3k4/8/8/3K4 w - - 2 2', t);
    const san = (from: 'c7' | 'd1', to: 'b5' | 'd2' | 'e6') => getChess(fen).move({
      from: transformSquare(from, t), to: transformSquare(to, t),
    }).san;
    const rejected = san('c7', 'b5');
    assert.equal(scoreKnightAndBishopWhiteMove(fen, rejected).knightDriftQualifies, false, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('c7', 'e6')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === rejected)!)?.id, 'r6', t.name);
    const pair = candidates.filter(c => c.san === rejected || c.san === san('d1', 'd2'));
    assert.deepEqual(selectCandidatesByRules(pair, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [san('d1', 'd2')], t.name);
    // Retain the double-opposition preference that made the nominal Na3 escape unavailable.
    const reply = getChess(fen);
    reply.move(rejected);
    reply.move({from: transformSquare('d4', t), to: transformSquare('c4', t)});
    const returnMove = reply.move({from: transformSquare('b5', t), to: transformSquare('c7', t)}).san;
    reply.undo();
    const onward = reply.moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(reply.fen(), san)}));
    assert.deepEqual(selectCandidatesByRules(onward, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [returnMove], t.name);
  }
});

test('knight detours reject two-step bishop proximity, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/1N3B2/2k5/8/8/8/8/7K w - - 0 1', t);
    const move = (to: 'a5' | 'd8') => getChess(fen).move({
      from: transformSquare('b7', t), to: transformSquare(to, t),
    }).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [move('a5')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === move('d8'))!)?.id, 'r6', t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('a5')).knightDriftQualifies, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('d8')).knightDriftQualifies, false, t.name);
  }
});

test('bishop-obstructed detours lose even when the attacked knight has no qualifying drift, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/1N3B2/2k5/8/8/7K/8/8 w - - 0 1', t);
    const san = getChess(fen).move({from: transformSquare('b7', t), to: transformSquare('d8', t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const invalid = candidates.find(c => c.san === san)!;
    assert.equal(invalid.score.knightDriftQualifies, false, t.name);
    assert.equal(invalid.score.knightDriftRank, 3, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.equal(selection.eliminatedBy.get(invalid)?.id, 'r6', t.name);
    const escape = getChess(fen).move({from: transformSquare('b7', t), to: transformSquare('a5', t)}).san;
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [escape], t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, escape).knightDriftRank, 2, t.name);

    const clear = transformFen('8/1N6/2k5/8/8/7K/8/5B2 w - - 0 1', t);
    const clearSan = getChess(clear).move({from: transformSquare('b7', t), to: transformSquare('d8', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(clear, clearSan).knightDriftQualifies, true, t.name);
  }
});

test('a chase with no king rescue or safe onward jump gives no drift credit, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('KB6/8/8/2kN4/8/8/8/8 w - - 0 1', t);
    const san = (to: 'c7' | 'f4') => getChess(fen).move({from: transformSquare('d5', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(move => ({san: move, score: scoreKnightAndBishopWhiteMove(fen, move)}));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('c7')).knightDriftQualifies, false, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    // Resulting proximity now lets r7 select Nc7 before the drift rule runs.
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('c7')], t.name);
    assert.equal(selection.lastEliminatingRule?.id, 'r7', t.name);
    const r7 = knightAndBishopWhiteRules.find(r => r.id === 'r7')!;
    assert.ok(r7.subpriorities![0]!.compare!(scoreKnightAndBishopWhiteMove(fen, san('c7')), scoreKnightAndBishopWhiteMove(fen, san('f4'))) < 0, t.name);
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


test('r6 centralizes an already king-protected knight without requiring closer king distance, across D4', () => {
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
    assert.equal(selection.lastEliminatingRule?.id, 'r6', t.name);
  }
});


test('r6 permits double opposition behind a diagonal blocker, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('2BK4/8/8/8/2k5/1N6/8/8 w - - 2 2', t);
    const move = getChess(fen).move({from: transformSquare('b3', t), to: transformSquare('c1', t)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    // r6 permits Nc1; r4.5 separately penalizes Be6 inside the expanded rectangle.
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules.filter(r => r.id === 'r6')).idealCandidates.map(c => c.san), [move], t.name);
    const bishop = getChess(fen).move({from: transformSquare('c8', t), to: transformSquare('e6', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishop).bishopMoveNearNoncentralKingPenalty, 1, t.name);
    for (const quiet of ['2B5/8/8/8/2k5/1N6/8/K7 w - - 2 2', '2BK4/8/8/8/3k4/1N6/8/8 w - - 2 2']) {
      const position = transformFen(quiet, t);
      const retreat = getChess(position).move({from: transformSquare('b3', t), to: transformSquare('c1', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(position, retreat).knightDriftQualifies, false, t.name);
    }
  }
});


test('r6 detours via Na4 when c8 is occupied, then brings the knight closer with Nb2, across D4', () => {
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
      assert.equal(selection.lastEliminatingRule?.id, 'r6', t.name);
    }
    const open = transformFen('8/8/1N6/2k5/8/4K3/8/6B1 w - - 2 2', t);
    const opposition = getChess(open).move({from: transformSquare('b6', t), to: transformSquare('c8', t)}).san;
    const detour = getChess(open).move({from: transformSquare('b6', t), to: transformSquare('a4', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(open, opposition).knightDoubleOpposition, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(open, detour).knightDriftQualifies, false, t.name);
  }
});


test('r7 defers to r6 double opposition when Black is diagonally between knight and king, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7K/8/8/4k3/3N4/8/8/5B2 w - - 2 2', t);
    const move = (to: 'b5' | 'e2' | 'c6') => getChess(fen).move({from: transformSquare('d4', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const r7 = knightAndBishopWhiteRules.find(rule => rule.id === 'r7')!;
    assert.equal(r7.subpriorities![0]!.when!(candidates.map(c => c.score)), false, t.name);
    for (const to of ['b5', 'e2'] as const) assert.equal(scoreKnightAndBishopWhiteMove(fen, move(to)).knightDoubleOpposition, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('c6')).knightDriftQualifies, false, t.name);
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san).sort(), [move('b5'), move('e2')].sort(), t.name);
  }
});


test('r6 rejects Nd4 when a diagonal chase leaves no onward king-step progress, ignoring bishop control across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const start of [
    'K7/8/2k5/5N2/8/8/8/1B6 w - - 0 1',
    'K7/8/2k5/5N2/8/8/8/6B1 w - - 0 1', // Bg1 controls c5, but drift cannot rely on it.
  ]) {
    const fen = transformFen(start, t);
    const move = getChess(fen).move({from: transformSquare('f5', t), to: transformSquare('d4', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).knightDriftQualifies, false, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.ok(!selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.some(c => c.san === move), t.name);
  }
});

test('r6 rejects approaching Black between the knight and king without gaining protection, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, qualifies] of [
      ['B2K4/8/8/4k3/8/8/5N2/8 w - - 0 1', false], // Black is strictly between d8 and f2.
      ['B3K3/8/8/4k3/8/8/5N2/8 w - - 0 1', false], // Outside the rectangle, but ...Kf5 induces a double-opposition return to f2.
      ['B3K3/8/8/k7/8/8/5N2/8 w - - 0 1', true],
      ['B7/8/8/7K/8/7k/5N2/8 w - - 0 1', true], // Reaching king protection overrides approaching Black.
    ] as const) {
      const fen = transformFen(start, t);
      const move = getChess(fen).move({from: transformSquare('f2', t), to: transformSquare('g4', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(fen, move).knightDriftQualifies, qualifies, t.name);
      if (!qualifies) {
        const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
        assert.ok(!selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.some(c => c.san === move), t.name);
      }
    }
  }
});


test('r6 reaches king protection before taking a double-opposition detour, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('5K2/8/6k1/7N/8/8/B7/8 w - - 2 2', t);
    const move = (to: 'g7' | 'g3') => getChess(fen).move({from: transformSquare('h5', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('g7')).kingKnightAdjacencyPenalty, 0, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('g3')).knightDoubleOpposition, true, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [move('g7')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === move('g3'))!)?.id, 'r6', t.name);
  }
});

test('invalid drift loses to an ordinary king move before later rules, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('K7/2k5/8/8/8/2N5/8/7B w - - 0 1', t);
    const invalid = getChess(fen).move({from: transformSquare('c3', t), to: transformSquare('d5', t)}).san;
    const ordinary = getChess(fen).move({from: transformSquare('a8', t), to: transformSquare('a7', t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, invalid).knightDriftRank, 2, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, ordinary).knightDriftRank, 1, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.ok(!selection.idealCandidates.some(c => c.san === invalid), t.name);
    const pair = candidates.filter(c => c.san === invalid || c.san === ordinary);
    assert.deepEqual(selectCandidatesByRules(pair, knightAndBishopWhiteRules.filter(r => r.id === 'r6'))
      .idealCandidates.map(c => c.san), [ordinary], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === invalid)!)?.id, 'r6', t.name);
  }
});

test('approaching an intervening Black king is allowed when three or more steps remain, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const start of [
    '2B5/8/8/2K1k3/8/8/8/7N w - - 0 1', // Nf2 leaves three steps to Black.
    'B7/8/2K1k3/8/8/8/8/7N w - - 0 1', // Nf2 leaves four steps to Black.
  ]) {
    const fen = transformFen(start, t);
    const move = getChess(fen).move({from: transformSquare('h1', t), to: transformSquare('f2', t)}).san;
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.knightDriftQualifies, true, t.name);
    assert.equal(score.knightDriftRank, 0, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move], t.name);
  }
});


test('r6 uses the strict interior rectangle and selects Ne3, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('2B5/8/8/2K1k3/8/8/6N1/8 w - - 0 1', t);
    const move = getChess(fen).move({from: transformSquare('g2', t), to: transformSquare('e3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move], t.name);
  }
});
