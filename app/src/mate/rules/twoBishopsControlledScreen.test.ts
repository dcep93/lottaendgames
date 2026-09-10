import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  edgeDistance,
  getChess,
  transformFen,
  transformSquare,
  type SquareTransform,
} from '../chess'
import { compareScoresByRules, firstDifferingRule, selectCandidatesByRules } from './selection'
import {
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
  type TwoBishopsWhiteMoveScore,
} from './twoBishops'

const loopFen = '8/7B/6K1/8/8/7k/8/2B5 w - - 0 1'

function transformedMove(
  fen: string,
  transform: SquareTransform,
  from: Square,
  to: Square,
): string {
  const move = getChess(fen).moves({ verbose: true }).find((candidate) =>
    candidate.from === transformSquare(from, transform) &&
    candidate.to === transformSquare(to, transform))
  assert.ok(move, `${transform.name}: ${from}-${to}`)
  return move.san
}

function assertNoWall(score: TwoBishopsWhiteMoveScore, label: string): void {
  assert.equal(score.ruleR10DiagonalCount, 99, label)
  assert.equal(score.ruleR10TargetPenalty, 1, label)
  assert.deepEqual(score.ruleR10TargetSquares, [], label)
  assert.equal(score.ruleR10KingDistance, 99, label)
}

test('r10 excludes the screened closest target behind Kg6 and prefers clearing the ray', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loopFen, transform)
    const blockedMove = transformedMove(fen, transform, 'c1', 'd2')
    const clearMove = transformedMove(fen, transform, 'g6', 'f6')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const blocked = candidates.find(({ san }) => san === blockedMove)!
    const clear = candidates.find(({ san }) => san === clearMove)!
    assert.equal(edgeDistance(transformSquare('g6', transform)), 1)
    assert.equal(blocked.score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(blocked.score.ruleR10TargetSquares,
      [], transform.name)
    assert.equal(blocked.score.ruleR10KingDistance, 99, transform.name)
    assert.equal(clear.score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(clear.score.ruleR10TargetSquares,
      [transformSquare('f5', transform)], transform.name)
    assert.equal(clear.score.ruleR10KingDistance, 1, transform.name)
    assert.equal(firstDifferingRule(blocked.score, clear.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    assert.ok(compareScoresByRules(clear.score, blocked.score,
      twoBishopsWhiteRules.filter(({ id }) => id === 'rule r10')) < 0, transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san),
      [transformedMove(fen, transform, 'g6', 'f6')], transform.name)
    assert.equal(selection.eliminatedBy.get(blocked)?.id, 'rule r10', transform.name)

    const result = getChess(fen)
    result.move(blockedMove)
    // The king controls the nearest hidden square, but every farther square
    // on Bh7's ray remains exposed. An outer screen is allowed regardless.
    assert.equal(result.isAttacked(transformSquare('f5', transform), 'w'), true)
    for (const square of ['e4', 'd3', 'c2', 'b1'] as const) {
      assert.equal(result.isAttacked(transformSquare(square, transform), 'w'),
        false, `${transform.name}: ${square}`)
    }
  }
})

test('reversing an outer bishop keeps its screened wall valid', () => {
  const reverseFen = '8/8/6K1/8/8/7k/2B5/2B5 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(reverseFen, transform)
    const move = transformedMove(fen, transform, 'c1', 'd2')
    const score = scoreTwoBishopsWhiteMove(fen, move)
    // With Bc2 instead of Bh7, Kg6 hides only h7, which the king controls.
    // The king and wall diagonal are unchanged from the long-tail example.
    assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(score.ruleR10TargetSquares,
      [transformSquare('f5', transform)], transform.name)
    const result = getChess(fen)
    result.move(move)
    assert.equal(result.isAttacked(transformSquare('h7', transform), 'w'), true)
  }
})

test('the outer wall remains valid when its hidden tail is controlled or empty at the endpoint', () => {
  const cases = [
    { fen: '8/7B/8/8/8/7k/2K5/2B5 w - - 0 1', king: 'c2', hidden: ['b1'] },
    { fen: '8/7B/8/8/8/7k/8/1KB5 w - - 0 1', king: 'b1', hidden: [] },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const move = transformedMove(fen, transform, 'c1', 'd2')
      const score = scoreTwoBishopsWhiteMove(fen, move)
      const label = `${transform.name}: ${fixture.king}`
      assert.equal(score.ruleR10DiagonalCount, 5, label)
      const result = getChess(fen)
      result.move(move)
      for (const square of fixture.hidden) {
        assert.equal(result.isAttacked(transformSquare(square, transform), 'w'), true, label)
      }
    }
  }
})

test('r10 allows unreachable inner screens but r6 requires unscreened diagonals', () => {
  const cases = [
    { fen: '8/8/8/8/8/8/3BK1k1/3B4 w - - 2 2', valid: false },
    { fen: '8/8/8/7B/8/8/3BK1k1/8 w - - 2 2', valid: true },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const move = transformedMove(fen, transform, 'd2', 'e3')
      const score = scoreTwoBishopsWhiteMove(fen, move)
      const label = `${transform.name}: ${fixture.valid ? 'Bh5' : 'Bd1'}`
      assert.equal(edgeDistance(transformSquare('e2', transform)), 1)
      assert.equal(score.ruleR6Applies, true, label)
      assert.equal(score.ruleR6DiagonalPenalty, 1, label)
      assert.equal(score.ruleR10DiagonalCount, 4, label)
      assert.equal(score.ruleR24Applies, true, label)
      assert.equal(score.ruleR24Penalty, 0, label)
      const result = getChess(fen)
      result.move(move)
      if (fixture.valid) {
        // Bh5 is screened by Ke2, but the only hidden square d1 is guarded.
        assert.equal(result.isAttacked(transformSquare('d1', transform), 'w'), true, label)
      } else {
        // Reversing the bishop to d1 leaves g4/h5 beyond the king's control.
        assert.equal(result.isAttacked(transformSquare('f3', transform), 'w'), true, label)
        for (const square of ['g4', 'h5'] as const) {
          assert.equal(result.isAttacked(transformSquare(square, transform), 'w'), false, label)
        }
      }
    }
  }
})

test('an inner-wall endpoint with no hidden ray remains valid for r10 and r6', () => {
  const starting = '8/8/8/7B/8/8/3B2k1/3K4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'd2', 'e3'))
    // Kd1 is the endpoint of Bh5's inner ray; no square lies behind it.
    assert.equal(score.ruleR10DiagonalCount, 4, transform.name)
    assert.equal(score.ruleR6DiagonalPenalty, 0, transform.name)
  }
})


test('a legal Black step onto a screened inner-wall square invalidates r10 and Phase 2', () => {
  const starting = '8/8/8/8/8/6k1/3BK3/3B4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = transformedMove(fen, transform, 'd2', 'e3')
    const result = getChess(fen)
    result.move(san)
    const hidden = transformSquare('g4', transform)
    assert.equal(result.isAttacked(hidden, 'w'), false, transform.name)
    assert.ok(result.moves({ verbose: true }).some((move) => move.to === hidden), transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assertNoWall(score, transform.name)
    assert.equal(score.ruleR6DiagonalPenalty, 1, transform.name)
  }
})

test('Kf6 keeps its inner wall when the screened h8 square is unreachable', () => {
  const starting = '8/8/7k/5K2/8/8/BB6/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = transformedMove(fen, transform, 'f5', 'f6')
    const result = getChess(fen)
    result.move(san)
    const hidden = transformSquare('h8', transform)
    assert.equal(result.isAttacked(hidden, 'w'), false, transform.name)
    assert.ok(result.moves({ verbose: true }).every((move) => move.to !== hidden), transform.name)
    const score = scoreTwoBishopsWhiteMove(fen, san)
    assert.equal(score.ruleR10DiagonalCount, 7, transform.name)
    assert.deepEqual([...score.ruleR10TargetSquares].sort(),
      (['f7', 'g8'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.equal(score.ruleR10KingDistance, 1, transform.name)
    const candidates = getChess(fen).moves().map((move) => ({ san: move, score: scoreTwoBishopsWhiteMove(fen, move) }))
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map((candidate) => candidate.san), [san], transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r10', transform.name)
  }
})
