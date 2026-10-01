import assert from 'node:assert/strict';
import test from 'node:test';
import {knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove} from './bishopKnight';

test('r3 uses setup lookup rather than the removed temporary proximity scores', () => {
  assert.match(knightAndBishopWhiteRules.find(rule => rule.id === 'r3')!.helpText, /central knight and king/);
  const score = scoreKnightAndBishopWhiteMove('8/8/3k4/8/8/8/3K4/N6B w - - 0 1', 'Kd3');
  for (const field of ['kingBlackDistanceSquared', 'bishopBlackDistanceSquared', 'knightBlackDistanceSquared']) {
    assert.ok(!(field in score));
  }
});
