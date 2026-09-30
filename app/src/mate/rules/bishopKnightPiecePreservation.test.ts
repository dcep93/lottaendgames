import assert from 'node:assert/strict';
import test from 'node:test';
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess';
import {bishopKnightPiecePreservationMoves as lookup} from './bishopKnightPiecePreservation';
import {bishopKnightRuleSet as policy, getIdealKnightAndBishopWhiteMoves as preferred} from './bishopKnight';
import {explainMove} from './selection';

const cases = [
  ['8/8/8/8/6N1/5k1B/3K4/8 w - - 6 4', 'Ne3'],
  ['8/8/8/8/8/7B/K3k1N1/8 w - - 0 1', 'Nf4+'],
  ['8/8/8/8/K7/5B2/8/4N1k1 w - - 0 1', 'Nc2'],
  // Safe alternatives exposed when the old king reversal is rejected.
  ['8/8/N7/1B6/8/1k6/8/1K6 w - - 0 1', 'Kc1'],
  ['8/8/8/8/8/8/1K1k1B2/6N1 w - - 0 1', 'Kb3'],
  ['8/8/8/8/8/8/2K1k1B1/7N w - - 0 1', 'Kc3'],
  ['8/8/N7/1B6/8/2k5/8/2K5 w - - 0 1', 'Kd1'],
  ['8/N7/1B6/8/2k5/8/2K5/8 w - - 0 1', 'Kd2'],
  ['8/8/8/8/8/2K1k3/6B1/7N w - - 0 1', 'Kc4'],
] as const;

test('r4.2 preserves the declared wins across D4 with ordinary rule attribution', () => {
  for (const [fen, san] of cases) {
    const move = getChess(fen).move(san);
    for (const transform of SQUARE_TRANSFORMS) {
      const f = transformFen(fen, transform);
      const expected = transformSquare(move.from, transform) + transformSquare(move.to, transform);
      assert.deepEqual(lookup(f), [expected]);
      const selected = preferred(f);
      assert.equal(selected.length, 1);
      const actual = getChess(f).move(selected[0]!);
      assert.equal(actual.from + actual.to, expected);
      const scores = policy.scoreWhiteCandidates!(f, policy.whiteMoves(f));
      assert.equal(explainMove(scores, policy.whiteRules, selected[0])?.id, 'r4.2');
      assert.deepEqual(lookup(f.replace(/ \d+ \d+$/, ' 82 42')), [expected]);
    }
  }
});

test('r4.2 is an exact source lookup and does not match wrong turn or extra material', () => {
  const [fen] = cases[0];
  assert.deepEqual(lookup(fen.replace(' w ', ' b ')), []);
  assert.deepEqual(lookup(fen.replace(/^8\//, 'R7/')), []);
  assert.deepEqual(lookup('8/8/8/8/8/2K5/B1N5/2k5 w - - 6 4'), []);
  const rules = policy.whiteRules.map(rule => rule.id);
  assert.equal(rules.indexOf('r4.2'), rules.indexOf('r4.1') + 1);
  assert.equal(rules.indexOf('r4.5'), rules.indexOf('r4.2') + 1);
  assert.ok(rules.indexOf('mate') < rules.indexOf('r1'));
});

test('r4.2 rejects exact undo loops for king and knight moves across D4', () => {
  const loops = [
    ['8/8/8/K7/8/3k4/B3N3/8 w - - 0 1', ['Nc1+', 'Kc2', 'Ne2', 'Kd3']],
    ['8/8/8/8/8/8/K1k1B3/5N2 w - - 0 1', ['Ka1', 'Kc1', 'Ka2', 'Kc2']],
    ['4B3/8/7N/6k1/8/8/8/1K6 w - - 0 1', ['Nf7+', 'Kf6', 'Nh6', 'Kg5']],
  ] as const;
  for (const [fen, line] of loops) {
    const replay = getChess(fen);
    const moves = line.map(san => replay.move(san));
    assert.equal(replay.fen().split(' ')[0], fen.split(' ')[0]);
    for (const transform of SQUARE_TRANSFORMS) {
      const f = transformFen(fen, transform);
      const game = getChess(f);
      const first = game.move({from: transformSquare(moves[0].from, transform), to: transformSquare(moves[0].to, transform)});
      game.move({from: transformSquare(moves[1].from, transform), to: transformSquare(moves[1].to, transform)});
      const undo = transformSquare(moves[2].from, transform) + transformSquare(moves[2].to, transform);
      assert.deepEqual(lookup(game.fen()), [undo]);
      const replyScores = policy.scoreWhiteCandidates!(game.fen(), policy.whiteMoves(game.fen()));
      const undoSan = game.move({from: transformSquare(moves[2].from, transform), to: transformSquare(moves[2].to, transform)}).san;
      assert.equal(explainMove(replyScores, policy.whiteRules, undoSan)?.id, 'r4.2');
      const scores = policy.scoreWhiteCandidates!(f, policy.whiteMoves(f));
      assert.equal(explainMove(scores, policy.whiteRules, first.san)?.id, 'r4.2');
      assert.ok(!preferred(f).includes(first.san));
      // Counters cannot hide or create a placement repetition.
      assert.deepEqual(preferred(f.replace(/ \d+ \d+$/, ' 82 42')), preferred(f));
    }
  }
});

test('r4.2 does not take over a reversal required by r4.1', () => {
  const fen = '8/8/8/N7/8/8/B7/K1k5 w - - 0 1';
  const scores = policy.scoreWhiteCandidates!(fen, policy.whiteMoves(fen));
  const candidate = scores.find(candidate => candidate.san === 'Nb3+')!;
  assert.equal(candidate.score.piecePreservationPenalty, 0);
  assert.equal(explainMove(scores, policy.whiteRules, 'Nb3+')?.id, 'r4.1');
});

test('r4.2 avoids a return forced by minors safe without overriding that higher rule', () => {
  const fen = '8/8/8/5B2/8/2K1k2N/8/8 w - - 0 1';
  for (const transform of SQUARE_TRANSFORMS) {
    const f = transformFen(fen, transform), board = getChess(f);
    const play = (from: Parameters<typeof transformSquare>[0], to: Parameters<typeof transformSquare>[0]) =>
      board.move({from: transformSquare(from, transform), to: transformSquare(to, transform)});
    const recommended = getChess(f).move({from: transformSquare('f5', transform), to: transformSquare('c8', transform)});
    const entry = play('h3', 'g1');
    play('e3', 'f2');
    const responseFen = board.fen();
    const reverse = play('g1', 'h3');
    play('f2', 'e3');
    assert.equal(board.fen().split(' ')[0], f.split(' ')[0]);
    assert.deepEqual(lookup(responseFen), []);
    const scores = policy.scoreWhiteCandidates!(f, policy.whiteMoves(f));
    assert.deepEqual(preferred(f), [recommended.san]);
    assert.equal(scores.find(c => c.san === entry.san)!.score.piecePreservationPenalty, 2);
    assert.equal(explainMove(scores, policy.whiteRules, entry.san)?.id, 'r4.2');
    assert.equal(explainMove(scores, policy.whiteRules, recommended.san)?.id, 'r4.2');
    const responses = policy.scoreWhiteCandidates!(responseFen, policy.whiteMoves(responseFen));
    assert.deepEqual(preferred(responseFen), [reverse.san]);
    assert.equal(explainMove(responses, policy.whiteRules, reverse.san)?.id, 'minors safe');
  }
});
