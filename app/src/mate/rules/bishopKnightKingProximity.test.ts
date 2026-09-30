import assert from 'node:assert/strict';
import test from 'node:test';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('temporary r3 and its proximity scores are removed', () => {
  assert.ok(!knightAndBishopWhiteRules.some(rule => rule.id === 'r3'));
  const score = scoreKnightAndBishopWhiteMove('8/8/3k4/8/8/8/3K4/N6B w - - 0 1', 'Kd3');
  for (const field of ['kingBlackDistanceSquared', 'bishopBlackDistanceSquared', 'knightBlackDistanceSquared']) {
    assert.ok(!(field in score));
  }
});
