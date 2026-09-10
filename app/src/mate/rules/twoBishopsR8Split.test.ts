import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, getChess, transformFen, transformSquare } from '../chess'
import { scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'
import { compareScoresByRules, selectCandidatesByRules } from './selection'

const starting = '8/1k1K4/3BB3/8/8/8/8/8 w - - 0 1'

test('r8 preserves the smaller Ke7 wall before accomplished Bh2 opposition', () => {
  const ids = twoBishopsWhiteRules.map(r => r.id)
  assert.deepEqual(ids.slice(ids.indexOf('rule r6'), ids.indexOf('rule r24')),
    ['rule r6', 'rule r6.2', 'rule r6.4', 'rule r7', 'rule r8', 'rule r9', 'rule r10', 'rule r19'])
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const moves = getChess(fen).moves({ verbose: true })
    const candidate = (from: 'd7' | 'd6', to: 'e7' | 'h2' | 'f8') => {
      const move = moves.find(m => m.from === transformSquare(from, transform)
        && m.to === transformSquare(to, transform))!
      return { san: move.san, score: scoreTwoBishopsWhiteMove(fen, move.san) }
    }
    const king = candidate('d7', 'e7'), opposition = candidate('d6', 'h2')
    const bishop = candidate('d6', 'f8')
    assert.equal(king.score.ruleR10DiagonalCount, 5)
    assert.equal(opposition.score.ruleR10DiagonalCount, 8)
    assert.equal(king.score.ruleR9Penalty, 1)
    assert.equal(opposition.score.ruleR9Penalty, 0)
    const pair = selectCandidatesByRules([king, opposition], twoBishopsWhiteRules)
    assert.deepEqual(pair.idealCandidates, [king])
    assert.equal(pair.eliminatedBy.get(opposition)?.id, 'rule r8')
    const all = moves.map(m => ({ san: m.san, score: scoreTwoBishopsWhiteMove(fen, m.san) }))
    const selection = selectCandidatesByRules(all, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(c => c.san), [king.san])
    assert.equal(selection.eliminatedBy.get(all.find(c => c.san === bishop.san)!)?.id, 'rule r24.5')
    assert.equal(king.score.ruleR10KingDistance, 2)
    assert.equal(bishop.score.ruleR10KingDistance, 2)
  }
})

test('r10 does not compare diagonal counts after their promotion to r8', () => {
  const r8 = twoBishopsWhiteRules.find(r => r.id === 'rule r8')!
  const r10 = twoBishopsWhiteRules.find(r => r.id === 'rule r10')!
  assert.equal(r8.helpText, "Prefer fewer diagonals for Black's king.")
  assert.equal(r10.subpriorities?.length, 3)
  const score = scoreTwoBishopsWhiteMove(starting, 'Ke7')
  const moreDiagonals = { ...score, ruleR10DiagonalCount: score.ruleR10DiagonalCount + 1 }
  assert.equal(compareScoresByRules(score, moreDiagonals, [r10]), 0)
  assert.ok(compareScoresByRules(score, moreDiagonals, [r8]) < 0)
})
