import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';
import {selectCandidatesByRules} from './selection';

test('an onward jump outranked by double opposition cannot justify a drift, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('B7/2N5/8/8/3k4/8/8/3K4 w - - 2 2', t);
    const san = (from: 'c7' | 'd1', to: 'b5' | 'd2' | 'e2' | 'e6') => getChess(fen).move({
      from: transformSquare(from, t), to: transformSquare(to, t),
    }).san;
    const rejected = san('c7', 'b5');
    assert.equal(scoreKnightAndBishopWhiteMove(fen, rejected).knightDriftQualifies, false, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san).sort(), [san('d1', 'd2'), san('d1', 'e2')].sort(), t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === rejected)!)?.id, 'r5.8', t.name);
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

test('knight drift does not penalize proximity to the bishop, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const start of [
      '8/1N3B2/2k5/8/8/8/8/7K w - - 0 1',
      '8/1N3B2/2k5/8/8/7K/8/8 w - - 0 1',
    ]) {
      const fen = transformFen(start, t);
      const move = getChess(fen).move({from: transformSquare('b7', t), to: transformSquare('d8', t)}).san;
      const score = scoreKnightAndBishopWhiteMove(fen, move);
      assert.equal(score.knightDriftQualifies, true, t.name);
      assert.equal(score.knightDriftRank, 0, t.name);
      const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
      assert.ok(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.some(c => c.san === move), t.name);
    }
  }
});

test('flanking an adjacent blocker prefers the clear central route, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('KB6/8/8/2kN4/8/8/8/8 w - - 0 1', t);
    const san = (to: 'c7' | 'f4' | 'c3') => getChess(fen).move({from: transformSquare('d5', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(move => ({san: move, score: scoreKnightAndBishopWhiteMove(fen, move)}));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('c7')).knightFlanksBlackKing, true, t.name);
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    // Both flanks route around Black; Nc3 clears Bb8 and stays more central.
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('c3')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === san('c7'))!)?.id, 'r6', t.name);
    const r7 = knightAndBishopWhiteRules.find(r => r.id === 'r7')!;
    assert.equal(r7.compare!(scoreKnightAndBishopWhiteMove(fen, san('c7')), scoreKnightAndBishopWhiteMove(fen, san('f4'))), 0, t.name);
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
    // King approaches now take precedence; among knight moves the opposition route remains preferred.
    const r6 = knightAndBishopWhiteRules.filter(r => r.id === 'r6');
    assert.ok(selectCandidatesByRules(candidates, knightAndBishopWhiteRules.filter(r => r.id === 'r5.8')).idealCandidates.every(c => c.score.kingStepsTowardKnight), t.name);
    assert.deepEqual(selectCandidatesByRules(candidates.filter(c => c.san.startsWith('N')), r6).idealCandidates.map(c => c.san), [move], t.name);
    const bishop = getChess(fen).move({from: transformSquare('c8', t), to: transformSquare('e6', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, bishop).bishopMoveNearNoncentralKingPenalty, 1, t.name);
    for (const quiet of ['2B5/8/8/8/2k5/1N6/8/K7 w - - 2 2', '2BK4/8/8/8/3k4/1N6/8/8 w - - 2 2']) {
      const position = transformFen(quiet, t);
      const retreat = getChess(position).move({from: transformSquare('b3', t), to: transformSquare('c1', t)}).san;
      assert.equal(scoreKnightAndBishopWhiteMove(position, retreat).knightDoubleOpposition, false, t.name);
    }
  }
});


test('r6 permits bishop-adjacent detours but requires an escape from the chosen flank, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    for (const [start, from, to] of [
      ['2B5/8/1N6/2k5/8/4K3/8/8 w - - 2 2', 'b6', 'd7'],
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


test('r7 leaves knight-only double-opposition ties unchanged, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7K/8/8/4k3/3N4/8/8/5B2 w - - 2 2', t);
    const move = (to: 'b5' | 'e2' | 'c6') => getChess(fen).move({from: transformSquare('d4', t), to: transformSquare(to, t)}).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const r7 = knightAndBishopWhiteRules.find(rule => rule.id === 'r7')!;
    assert.equal(r7.compare!(scoreKnightAndBishopWhiteMove(fen, move('b5')), scoreKnightAndBishopWhiteMove(fen, move('e2'))), 0, t.name);
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

test('r6 still checks onward escapes when approaching Black, across D4', () => {
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
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === invalid)!)?.id, 'r5.8', t.name);
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


test('r6 selects Ne3 in the former strict-interior example, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('2B5/8/8/2K1k3/8/8/6N1/8 w - - 0 1', t);
    const move = getChess(fen).move({from: transformSquare('g2', t), to: transformSquare('e3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move], t.name);
  }
});


test('ordinary knight drift can favor central proximity despite a nearby bishop, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('2B5/8/8/8/Nk5K/8/8/8 w - - 0 1', t);
    const move = (to: 'b2' | 'b6') => getChess(fen).move({
      from: transformSquare('a4', t), to: transformSquare(to, t),
    }).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b6')).knightDriftQualifies, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b2')).knightDriftQualifies, true, t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === move('b2'))!)?.id, 'r6', t.name);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [move('b6')], t.name);
  }
});


test('a retreat can qualify but a forward approach wins without bishop proximity penalties, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/2k4K/1N6/8/2B5/8/8/8 w - - 2 2', t);
    const move = (to: 'a4' | 'a8' | 'd5') => getChess(fen).move({
      from: transformSquare('b6', t), to: transformSquare(to, t),
    }).san;
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('a8')).knightDriftQualifies, false, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('a4')).knightDriftQualifies, true, t.name);
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move('d5')], t.name);
    // The advertised escape really exists after every legal reply, including Kc6.
    const board = getChess(fen);
    board.move(move('a4'));
    for (const reply of board.moves()) {
      board.move(reply);
      const escape = {from: transformSquare('a4', t), to: transformSquare('c3', t)};
      assert.ok(board.moves({verbose: true}).some(m => m.from === escape.from && m.to === escape.to), reply);
      board.undo();
    }
  }
});


test('route around an intervening adjacent king before measuring White king proximity, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('6B1/7K/8/Nk6/8/8/8/8 w - - 0 1', t);
    const move = (to: 'b3' | 'b7') => getChess(fen).move({
      from: transformSquare('a5', t), to: transformSquare(to, t),
    }).san;
    const low = scoreKnightAndBishopWhiteMove(fen, move('b3'));
    const high = scoreKnightAndBishopWhiteMove(fen, move('b7'));
    for (const score of [low, high]) {
      assert.equal(score.knightFlanksBlackKing, true, t.name);
      assert.equal(score.knightDriftQualifies, true, t.name);
    }
    assert.ok(low.knightKingProximityScore > high.knightKingProximityScore, t.name);
    assert.ok(low.knightMiddle16ProximityScore < high.knightMiddle16ProximityScore, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move('b3')], t.name);
    const outside = transformFen('6B1/8/8/Nk6/8/8/8/K7 w - - 0 1', t);
    const outsideMove = getChess(outside).move({from: transformSquare('a5', t), to: transformSquare('b3', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(outside, outsideMove).knightFlanksBlackKing, false, t.name);
  }
});


test('r5.8 prefers a king step toward the knight and r7 breaks centrality ties, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('6B1/6K1/8/N1k5/8/8/8/8 w - - 0 1', t);
    const san = (from: 'g7' | 'a5', to: 'f6' | 'f7' | 'f8' | 'b7') => getChess(fen).move({
      from: transformSquare(from, t), to: transformSquare(to, t),
    }).san;
    for (const to of ['f6', 'f7'] as const) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san('g7', to)).kingStepsTowardKnight, true, t.name);
    }
    // Kf8 approaches the knight too, but moves farther from the center.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('g7', 'f8')).kingStepsTowardKnight, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san('a5', 'b7')).knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [san('g7', 'f6')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === san('a5', 'b7'))!)?.id, 'r5.8', t.name);
    assert.equal(selection.lastEliminatingRule?.id, 'r7', t.name);
  }
});

test('drift reaches Whites side of Black before minimizing direct king distance, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/BK6/8/1k6/8/8/3N4 w - - 0 1', t);
    const move = (to: 'e3' | 'b2') => getChess(fen).move({
      from: transformSquare('d1', t), to: transformSquare(to, t),
    }).san;
    const forward = scoreKnightAndBishopWhiteMove(fen, move('e3'));
    const near = scoreKnightAndBishopWhiteMove(fen, move('b2'));
    assert.equal(forward.knightDriftQualifies, true, t.name);
    assert.equal(near.knightDriftQualifies, true, t.name);
    assert.ok(forward.knightKingProximityScore > near.knightKingProximityScore, t.name);
    assert.ok(forward.knightWhiteSideOfBlackDistance < near.knightWhiteSideOfBlackDistance, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [move('e3')], t.name);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === move('b2'))!)?.id, 'r6', t.name);
  }
});


test('a flanking drift must still leave an escape after Black attacks it, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('7K/8/1Nk5/8/2B5/8/8/8 w - - 0 1', t);
    const board = getChess(fen);
    const move = board.move({from: transformSquare('b6', t), to: transformSquare('c8', t)}).san;
    board.move({from: transformSquare('c6', t), to: transformSquare('d7', t)});
    // Ne7 would be capturable by Kd7; the other forward jump, e9, is off-board.
    const score = scoreKnightAndBishopWhiteMove(fen, move);
    assert.equal(score.knightFlanksBlackKing, true, t.name);
    assert.equal(score.knightDriftQualifies, false, t.name);
    assert.equal(score.knightDriftRank, 3, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    const selection = selectCandidatesByRules(candidates, knightAndBishopWhiteRules);
    assert.equal(selection.eliminatedBy.get(candidates.find(c => c.san === move)!)?.id, 'r6', t.name);
  }
});


test('r6 allows Nc2 to approach an intervening Black king, across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('4B3/8/8/4K3/2k5/8/8/N7 w - - 0 1', t);
    const move = getChess(fen).move({from: transformSquare('a1', t), to: transformSquare('c2', t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move], t.name);
  }
});


test('flank escapes may reduce Euclidean distance when king-step distance ties, ignoring bishop control across D4', () => {
  for (const t of SQUARE_TRANSFORMS) for (const start of [
    '7K/5B2/8/Nk6/8/8/8/8 w - - 2 2',
    '6BK/8/8/Nk6/8/8/8/8 w - - 2 2',
  ]) {
    const fen = transformFen(start, t);
    const move = (to: 'b3' | 'b7') => getChess(fen).move({from: transformSquare('a5', t), to: transformSquare(to, t)}).san;
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b3')).knightDriftQualifies, true, t.name);
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('b7')).knightDriftQualifies, true, t.name);
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(fen, san)}));
    assert.deepEqual(selectCandidatesByRules(candidates, knightAndBishopWhiteRules).idealCandidates.map(c => c.san), [move('b3')], t.name);
  }
});
