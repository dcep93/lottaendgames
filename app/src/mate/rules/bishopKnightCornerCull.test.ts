import assert from 'node:assert/strict'
import test from 'node:test'
import { knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'

test('removed king-proximity scoring fields remain absent', () => {
  assert.ok(!knightAndBishopWhiteRules.some(rule => rule.id === 'r3'))
  const score = scoreKnightAndBishopWhiteMove('8/k2B4/8/3N4/8/K7/8/8 w - - 0 1', 'Kb4')
  for (const field of ['supportedKingProximityScore', 'cornerKnightProximityScore', 'cornerKingProximityScore', 'bishopCornerDiagonalScore']) {
    assert.equal(field in score, false)
  }
})
