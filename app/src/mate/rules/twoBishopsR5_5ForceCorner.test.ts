import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, getChess, transformFen, transformSquare, kingDistance } from '../chess'
import { analyzeTwoBishopsWhiteSelection, scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'

test('restored r5.5 uses the starting inner bishop between r5 and r6', () => {
  const ids = twoBishopsWhiteRules.map(r => r.id)
  assert.deepEqual(ids.slice(ids.indexOf('rule r5'), ids.indexOf('rule r6') + 1),
    ['rule r5', 'rule r5.5', 'rule r6'])
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('2B5/8/5K1k/8/8/6B1/8/8 w - - 0 1', transform)
    const moves = getChess(fen).moves({ verbose: true })
    const bg4 = moves.find(m => m.from === transformSquare('c8', transform) && m.to === transformSquare('g4', transform))!
    assert.deepEqual(analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves, [bg4.san])
    for (const move of moves) {
      const score = scoreTwoBishopsWhiteMove(fen, move.san)
      assert.equal(score.ruleR5_5Applies, true)
      assert.deepEqual(score.ruleR5_5InnerBishops, [transformSquare('c8', transform)])
      assert.deepEqual(score.ruleR5_5TargetCorners, [transformSquare('h8', transform)])
      const after = getChess(fen); after.move(move.san)
      const replies = after.moves({ verbose: true })
      const corner = transformSquare('h8', transform)
      // In this h8 fixture the stationary outer bishop stays on g3.
      // Its adjacent inner diagonal is d1-h5 (file minus rank = 3);
      // g4 is the only destination on that diagonal reachable from c8.
      const remainsInner = (['g4'] as const)
        .map(square => transformSquare(square, transform)).includes(move.to)
      const succeeds = move.from === transformSquare('c8', transform) && remainsInner && replies.length > 0 &&
        replies.every(reply => kingDistance(reply.to, corner) < kingDistance(transformSquare('h6', transform), corner))
      assert.equal(score.ruleR5_5Penalty, succeeds ? 0 : 1)
    }
  }
})

test('r5.5 remains inactive without starting edge opposition', () => {
  for (const fen of [
    '8/1k1K4/3BB3/8/8/8/8/8 w - - 0 1',
    '8/8/6B1/8/8/4K3/8/2Bk4 w - - 0 1',
  ]) {
    for (const san of getChess(fen).moves()) {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      assert.equal(score.ruleR5_5Applies, false)
    }
  }
})


test('Bf6 gets no r5.5 credit after switching from the inner to the outer wall', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/6B1/8/5K1k/2B5/8 w - - 0 1', transform)
    const move = getChess(fen).moves({ verbose: true }).find(m =>
      m.from === transformSquare('g5', transform) && m.to === transformSquare('f6', transform))!
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.ruleR5_5Applies, true)
    assert.deepEqual(score.ruleR5_5InnerBishops, [transformSquare('g5', transform)])
    assert.equal(score.ruleR5_5Penalty, 1)
    const after = getChess(fen); after.move(move.san)
    assert.deepEqual(after.moves({ verbose: true }).map(m => m.to), [transformSquare('h2', transform)])
    assert.ok(!analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves.includes(move.san))
  }
})
