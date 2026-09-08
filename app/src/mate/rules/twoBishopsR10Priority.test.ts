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
import {
  compareScoresByRules,
  firstDifferingRule,
  selectCandidatesByRules,
} from './selection'
import {
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
  type TwoBishopsWhiteMoveScore,
} from './twoBishops'

const loadedFen = '8/8/4K3/8/8/4k3/1B6/1B6 w - - 42 22'
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

function priorities(score: TwoBishopsWhiteMoveScore): readonly number[] {
  return [score.ruleR10DiagonalCount, score.ruleR10KingDistance, score.ruleR10EdgePenalty]
}

test('r10 selects Kd5 over Bg6 for target proximity before clearing the corner edge', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const kingMove = transformedMove(fen, transform, 'e6', 'd5')
    const bishopMove = transformedMove(fen, transform, 'b1', 'g6')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const king = candidates.find(({ san }) => san === kingMove)!
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    assert.deepEqual(priorities(king.score), [6, 1, 1], transform.name)
    assert.deepEqual(priorities(bishop.score), [6, 2, 0], transform.name)
    for (const candidate of [king, bishop]) {
      assert.deepEqual(candidate.score.ruleR10TargetSquares,
        [transformSquare('d4', transform)], transform.name)
    }
    assert.equal(firstDifferingRule(king.score, bishop.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san),
      [kingMove], transform.name)
    assert.equal(selection.eliminatedBy.get(bishop)?.id, 'rule r10', transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r10', transform.name)
  }
})

test('r10 still clears the corner edge when diagonal count and target steps tie', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const offEdgeMove = transformedMove(fen, transform, 'b1', 'g6')
    const onEdgeMove = transformedMove(fen, transform, 'b1', 'h7')
    const offEdge = scoreTwoBishopsWhiteMove(fen, offEdgeMove)
    const onEdge = scoreTwoBishopsWhiteMove(fen, onEdgeMove)
    assert.deepEqual(priorities(offEdge), [6, 2, 0], transform.name)
    assert.deepEqual(priorities(onEdge), [6, 2, 1], transform.name)
    assert.ok(compareScoresByRules(offEdge, onEdge, [r10]) < 0, transform.name)
    assert.ok(compareScoresByRules(onEdge, offEdge, [r10]) > 0, transform.name)
  }
})

test('r10 keeps diagonal count ahead of target proximity even when the smaller enclosure has no target', () => {
  const starting = '8/8/8/4K3/8/6k1/3B4/3B4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const fewerMove = transformedMove(fen, transform, 'd2', 'f4')
    const closerMove = transformedMove(fen, transform, 'd1', 'c2')
    const fewer = scoreTwoBishopsWhiteMove(fen, fewerMove)
    const closer = scoreTwoBishopsWhiteMove(fen, closerMove)
    assert.deepEqual(priorities(fewer), [4, 99, 0], transform.name)
    assert.deepEqual(fewer.ruleR10TargetSquares, [], transform.name)
    assert.deepEqual(priorities(closer), [5, 1, 0], transform.name)
    assert.deepEqual([...closer.ruleR10TargetSquares].sort(),
      ['e4', 'f5'].map((square) => transformSquare(square as Square, transform)).sort(),
      transform.name)
    assert.ok(compareScoresByRules(fewer, closer, [r10]) < 0, transform.name)
    assert.ok(compareScoresByRules(closer, fewer, [r10]) > 0, transform.name)
  }
})

test('the final edge preference continues to exempt bishops on Phase 2 diagonals', () => {
  const starting = '8/8/8/4K3/8/6k1/3B4/3B4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const edgeMove = transformedMove(fen, transform, 'd2', 'h6')
    const offEdgeMove = transformedMove(fen, transform, 'd2', 'g5')
    const edge = scoreTwoBishopsWhiteMove(fen, edgeMove)
    const offEdge = scoreTwoBishopsWhiteMove(fen, offEdgeMove)
    assert.equal(edgeDistance(transformSquare('h6', transform)), 0)
    assert.deepEqual(priorities(edge), [4, 1, 0], transform.name)
    assert.deepEqual(priorities(offEdge), [4, 1, 0], transform.name)
    assert.equal(compareScoresByRules(edge, offEdge, [r10]), 0, transform.name)
  }
})
