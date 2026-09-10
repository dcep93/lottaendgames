import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  kingDistance,
  transformFen,
  transformSquare,
  type SquareTransform,
} from '../chess'
import { compareScoresByRules, firstDifferingRule, selectCandidatesByRules } from './selection'
import { scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'

const loadedFen = '3k4/8/5K2/8/8/B7/B7/8 w - - 56 29'
const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!

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

test('r10 ties occupying a target with orthogonal and diagonal adjacency', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const onTarget = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'f7'))
    const adjacent = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'g7'))
    const bishop = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'a2', 'b3'))
    const diagonal = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'g6'))
    const targets = ['e6', 'f7'].map((square) => transformSquare(square as Square, transform))
    for (const [score, king, rawDistance, scoredDistance] of [
      [onTarget, 'f7', 0, 1], [adjacent, 'g7', 1, 1], [bishop, 'f6', 1, 1],
      [diagonal, 'g6', 1, 1],
    ] as const) {
      assert.equal(Math.min(...targets.map((target) =>
        kingDistance(transformSquare(king, transform), target))), rawDistance, transform.name)
      assert.deepEqual([...score.ruleR10TargetSquares].sort(), [...targets].sort(), transform.name)
      assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
      assert.equal(score.ruleR10KingDistance, scoredDistance, transform.name)
    }
    assert.equal(onTarget.ruleR10OuterBishopPenalty, 1, transform.name)
    assert.equal(adjacent.ruleR10OuterBishopPenalty, 1, transform.name)
    assert.equal(bishop.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(compareScoresByRules(onTarget, adjacent, [r10]), 0, transform.name)
    assert.equal(compareScoresByRules(adjacent, diagonal, [r10]), 0, transform.name)
    assert.ok(compareScoresByRules(bishop, onTarget, [r10]) < 0, transform.name)
    assert.equal(firstDifferingRule(bishop, onTarget, twoBishopsWhiteRules)?.id,
      'rule r10', transform.name)
  }
})

test('r10 preserves distances beyond one and the missing-target sentinel', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const farther = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'g5'))
    const adjacent = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'g7'))
    assert.equal(farther.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(farther.ruleR10KingDistance, 2, transform.name)
    assert.ok(compareScoresByRules(adjacent, farther, [r10]) < 0, transform.name)

    // Be6 occupies one of the two closest candidates. Only the
    // unoccupied f7 remains a target, preserving distance one.
    const occupied = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'a2', 'e6'))
    assert.equal(occupied.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual([...occupied.ruleR10TargetSquares].sort(),
      ['f7'].map((square) => transformSquare(square as Square, transform)).sort(),
      transform.name)
    assert.equal(occupied.ruleR10TargetPenalty, 0, transform.name)
    assert.equal(occupied.ruleR10KingDistance, 1, transform.name)

    // Bb1 breaks the adjacent wall pair, so no target is available.
    const unaligned = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'a2', 'b1'))
    assert.equal(unaligned.ruleR10DiagonalCount, 99, transform.name)
    assert.deepEqual(unaligned.ruleR10TargetSquares, [], transform.name)
    assert.equal(unaligned.ruleR10KingDistance, 99, transform.name)
  }
})

test('Kf5 excludes occupied g6 but keeps f5 and beats the outer bishop retreat onto h7', () => {
  const starting = '8/8/6B1/8/4K2k/8/3B4/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const kingMove = transformedMove(fen, transform, 'e4', 'f5')
    const bishopMove = transformedMove(fen, transform, 'g6', 'h7')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const king = candidates.find(({ san }) => san === kingMove)!
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    const targets = ['f5', 'g6'].map((square) => transformSquare(square as Square, transform))
    for (const candidate of [king, bishop]) {
      assert.equal(candidate.score.ruleR10DiagonalCount, 5, transform.name)
      assert.deepEqual([...candidate.score.ruleR10TargetSquares].sort(),
        candidate === king ? [transformSquare('f5', transform)] : [...targets].sort(), transform.name)
      assert.equal(candidate.score.ruleR10TargetPenalty, 0, transform.name)
    }
    assert.equal(king.score.ruleR10KingDistance, 1, transform.name)
    assert.equal(bishop.score.ruleR10KingDistance, 1, transform.name)
    const afterKing = getChess(fen)
    afterKing.move(kingMove)
    assert.equal(afterKing.get(transformSquare('g6', transform))?.type, 'b', transform.name)
    // Bg6 is off the target corner's edge despite being only two king steps
    // from Black. Bh7 is three steps away but remains on that edge.
    assert.equal(king.score.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(bishop.score.ruleR10OuterBishopPenalty, 1, transform.name)
    assert.ok(compareScoresByRules(king.score, bishop.score, [r10]) < 0, transform.name)
    assert.equal(king.score.ruleR19Penalty, 1, transform.name)
    assert.equal(bishop.score.ruleR19Penalty, 0, transform.name)
    assert.equal(firstDifferingRule(king.score, bishop.score, twoBishopsWhiteRules)?.id,
      'rule r10', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [kingMove], transform.name)
    assert.equal(selection.eliminatedBy.get(bishop)?.id, 'rule r10', transform.name)
    // R10's minimum-one floor ties on-target Kf5 with adjacent Ke5;
    // Kf5 is one squared unit from the beyond-wall diagonal.
    assert.equal(king.score.ruleR24_5KingDistance, 1, transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r25', transform.name)
  }
})

test('the distance floor does not relax raw outer-wall target eligibility', () => {
  const fixtures = [
    { fen: '8/6B1/8/8/8/2K5/2B4k/8 w - - 0 1', black: 'h2', target: 'e5', whiteSteps: 3, blackSteps: 3 },
    // White is Euclidean-farther from e5 (sqrt(18) versus sqrt(13)), but
    // tied at three king steps. Eligibility continues to use king steps.
    { fen: '8/6B1/8/8/8/2K4k/2B5/8 w - - 0 1', black: 'h3', target: 'e5', whiteSteps: 3, blackSteps: 3 },
    { fen: '8/6B1/8/8/7k/2K5/2B5/8 w - - 0 1', black: 'h4', target: 'f6', whiteSteps: 4, blackSteps: 2 },
  ] as const
  for (const fixture of fixtures) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const target = transformSquare(fixture.target, transform)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'c3', 'b2'))
      assert.equal(kingDistance(transformSquare('b2', transform), target), fixture.whiteSteps)
      assert.equal(kingDistance(transformSquare(fixture.black, transform), target), fixture.blackSteps)
      assert.equal(score.ruleR10DiagonalCount, 6, transform.name)
      const eligible = fixture.whiteSteps <= fixture.blackSteps
      assert.deepEqual(score.ruleR10TargetSquares, eligible ? [target] : [], transform.name)
      assert.equal(score.ruleR10KingDistance, eligible ?
        kingDistance(transformSquare('b2', transform), target) : 99, transform.name)
    }
  }
})
