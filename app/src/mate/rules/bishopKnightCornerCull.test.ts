import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../chess'
import { bishopKnightRuleSet, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { selectIdealMoves } from './selection'

const cornerRule = knightAndBishopWhiteRules.find(rule => rule.id === 'r2.5')!

test('r2.5 remains visible but filters no moves after the corner-preference cull', () => {
  // Former exact maneuvers, bishop placements, king targets, and far-apart five-diagonals.
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '8/8/kNK5/8/B7/8/8/8 w - - 2 2',
      '1kB5/1N6/1K6/8/8/8/8/8 w - - 2 2',
      '8/8/1kB5/8/1NK5/8/8/8 w - - 0 1',
      '1k6/1N6/B7/1K6/8/8/8/8 w - - 0 1',
      '8/8/8/3B4/3K4/k2N4/8/8 w - - 0 1',
      '8/2KB4/k7/3N4/8/8/8/8 w - - 0 1',
      '8/k2B4/8/3N4/8/8/K7/8 w - - 0 1',
      '8/k2B4/8/3N4/8/K7/8/8 w - - 0 1',
      '3k4/5K2/8/8/8/3N4/B7/8 w - - 0 1',
    ]) {
      const reflected = transformFen(fen, transform)
      const candidates = getChess(reflected).moves().map(san => ({san, score: scoreKnightAndBishopWhiteMove(reflected, san)}))
      assert.deepEqual(selectIdealMoves(candidates, [cornerRule]), candidates.map(candidate => candidate.san))
      for (const {score} of candidates) {
        assert.equal(cornerRule.applies!(score), score.supportedDiagonalSizeScore < 99)
        assert.ok(!Object.keys(score).some(key => /Maneuver|^three|^five|^seven|^diagonalKing/.test(key)))
      }
    }
  }
  assert.doesNotMatch(cornerRule.helpText, /No preferences are currently defined/)
  assert.doesNotMatch(cornerRule.helpText, /skip|more than 3/)
  assert.ok(!bishopKnightRuleSet.help!.notes!.some(note => /prefer Kd4|prefer Nd6|prefer Kc5|prefer Kd5/.test(note)))
})


test('removed king-proximity scoring fields remain absent', () => {
  assert.ok(!knightAndBishopWhiteRules.some(rule => rule.id === 'r3'))
  const score = scoreKnightAndBishopWhiteMove('8/k2B4/8/3N4/8/K7/8/8 w - - 0 1', 'Kb4')
  for (const field of ['supportedKingProximityScore', 'cornerKnightProximityScore', 'cornerKingProximityScore', 'bishopCornerDiagonalScore']) {
    assert.equal(field in score, false)
  }
})
