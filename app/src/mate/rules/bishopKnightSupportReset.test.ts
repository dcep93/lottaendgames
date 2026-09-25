import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen } from '../chess'
import { bishopKnightRuleSet, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'

const formerDeclarations = [
  'k7/8/BK6/3N4/8/8/8/8 b - - 1 1',
  '2k5/3B4/3K4/3N4/8/8/8/8 b - - 1 1',
  '8/8/8/1k6/8/1B1N4/1K6/8 b - - 1 1',
  '8/1k1K4/8/B7/8/3N4/8/8 b - - 42 22',
  '1k6/8/2K5/8/8/1B1N4/8/8 b - - 1 1',
  '8/8/3k4/8/3K4/1B1N4/8/8 b - - 1 1',
  '1k6/3B4/1K6/3N4/8/8/8/8 b - - 1 1',
]

test('all earlier support declarations are discarded, including D4 and counters', () => {
  for (const fen of formerDeclarations) for (const transform of SQUARE_TRANSFORMS) {
    const f = transformFen(fen, transform)
    assert.deepEqual(knightAndBishopSupportedDiagonal(f), {size: 99, knight: 99})
    assert.equal(bishopKnightRuleSet.phaseAfterWhiteMove!(f), '1/2')
    const before = f.replace(' b ', ' w ')
    for (const move of getChess(before).moves({verbose: true}).filter(move => move.captured !== 'k').map(move => move.san)) {
      const score = scoreKnightAndBishopWhiteMove(before, move)
      assert.equal(score.supportedDiagonalSizeScore, 99)
      assert.equal(score.supportedThreeCheckScore, 0)
      assert.equal(score.declaredSupportedKnightAdvancePenalty, 0)
    }
  }
})

test('r2.5 and its old preferences and declarations are absent', () => {
  assert.ok(!knightAndBishopWhiteRules.some(rule => rule.id === 'r2.5'))
  assert.ok(bishopKnightRuleSet.help.notes.some(note => note.includes('Support has been reset')))
  assert.ok(!bishopKnightRuleSet.help.notes.some(note => note.startsWith('Exact supported') || note.startsWith('r2.5 general')))
  assert.throws(() => knightAndBishopSupportedDiagonal(formerDeclarations[0]!.replace(' b ', ' w ')), /after White/)
})
