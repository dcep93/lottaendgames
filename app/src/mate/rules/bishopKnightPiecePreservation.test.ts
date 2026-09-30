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
