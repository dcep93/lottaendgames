import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  edgeDistance,
  getChess,
  kingDistance,
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
  return [score.ruleR10DiagonalCount, score.ruleR10OuterBishopPenalty, score.ruleR10KingDistance]
}

test('r10 ties orthogonal Kd5 and diagonal Ke5 ahead of distant Bg6', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const kingMove = transformedMove(fen, transform, 'e6', 'd5')
    const diagonalKingMove = transformedMove(fen, transform, 'e6', 'e5')
    const bishopMove = transformedMove(fen, transform, 'b1', 'g6')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const king = candidates.find(({ san }) => san === kingMove)!
    const diagonalKing = candidates.find(({ san }) => san === diagonalKingMove)!
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    assert.deepEqual(priorities(king.score), [6, 0, 1], transform.name)
    assert.deepEqual(priorities(bishop.score), [6, 0, 2], transform.name)
    for (const candidate of [king, diagonalKing, bishop]) {
      assert.deepEqual(candidate.score.ruleR10TargetSquares,
        [transformSquare('d4', transform)], transform.name)
    }
    assert.equal(firstDifferingRule(king.score, bishop.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    // Ke5 may screen the a1–h8 outer wall, preserving the d4 target.
    // Both approaches are one king step from d4.
    assert.deepEqual(priorities(diagonalKing.score), [6, 0, 1], transform.name)
    assert.equal(compareScoresByRules(king.score, diagonalKing.score, [r10]), 0,
      transform.name)
    assert.equal(firstDifferingRule(king.score, diagonalKing.score,
      twoBishopsWhiteRules)?.id, 'rule r24.5', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san),
      [diagonalKingMove], transform.name)
    assert.equal(selection.eliminatedBy.get(bishop)?.id, 'rule r10', transform.name)
    assert.equal(selection.eliminatedBy.get(king)?.id, 'rule r24.5', transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r24.5', transform.name)
  }
})

test('r10 ignores whether the inner bishop occupies the target corner edge', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const offEdgeMove = transformedMove(fen, transform, 'b1', 'g6')
    const onEdgeMove = transformedMove(fen, transform, 'b1', 'h7')
    const offEdge = scoreTwoBishopsWhiteMove(fen, offEdgeMove)
    const onEdge = scoreTwoBishopsWhiteMove(fen, onEdgeMove)
    assert.deepEqual(priorities(offEdge), [6, 0, 2], transform.name)
    assert.deepEqual(priorities(onEdge), [6, 0, 2], transform.name)
    assert.equal(compareScoresByRules(offEdge, onEdge, [r10]), 0, transform.name)
  }
})

test('r8 keeps diagonal count ahead of target proximity with distant inside-wall targets', () => {
  const cases = [
    {
      // The f4 target is farther from White than e4/f5.
      starting: '8/8/8/3K4/8/6k1/3B4/3B4 w - - 0 1',
      fewerFrom: 'd2', fewerTo: 'g5', closerFrom: 'd1', closerTo: 'c2',
      fewerPriorities: [4, 0, 2], closerPriorities: [5, 0, 1],
      fewerTargets: ['f4'], closerTargets: ['e4', 'f5'],
    },
    {
      // White is inside the smaller wall and may target c5.
      starting: '8/8/8/8/1k6/3BB3/3K4/8 w - - 0 1',
      fewerFrom: 'd2', fewerTo: 'c2', closerFrom: 'd2', closerTo: 'e2',
      fewerPriorities: [5, 0, 3], closerPriorities: [5, 0, 3],
      fewerTargets: ['c5'], closerTargets: ['c5'],
    },
  ] as const
  for (const entry of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(entry.starting, transform)
      const fewerMove = transformedMove(fen, transform, entry.fewerFrom, entry.fewerTo)
      const closerMove = transformedMove(fen, transform, entry.closerFrom, entry.closerTo)
      const fewer = scoreTwoBishopsWhiteMove(fen, fewerMove)
      const closer = scoreTwoBishopsWhiteMove(fen, closerMove)
      assert.deepEqual(priorities(fewer), entry.fewerPriorities, transform.name)
      assert.deepEqual([...fewer.ruleR10TargetSquares].sort(),
        entry.fewerTargets.map((square) => transformSquare(square, transform)).sort(),
        transform.name)
      assert.deepEqual(priorities(closer), entry.closerPriorities, transform.name)
      assert.deepEqual([...closer.ruleR10TargetSquares].sort(),
        entry.closerTargets.map((square) => transformSquare(square, transform)).sort(),
        transform.name)
      const comparison = compareScoresByRules(fewer, closer,
        twoBishopsWhiteRules.filter(r => r.id === 'rule r8' || r.id === 'rule r10'))
      // Equal diagonal counts and three-step target distances tie in the second case.
      if (entry.fewerPriorities[0] === entry.closerPriorities[0]) {
        assert.equal(comparison, 0, transform.name)
      } else {
        assert.ok(comparison < 0, transform.name)
      }
    }
  }
})

test('the outer bishop must be off the target corner edge even on Phase 2 diagonals', () => {
  const starting = '8/8/8/4K3/8/6k1/3B4/3B4 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const edgeMove = transformedMove(fen, transform, 'd2', 'h6')
    const offEdgeMove = transformedMove(fen, transform, 'd1', 'e2')
    const nearMove = transformedMove(fen, transform, 'd2', 'g5')
    const innerEdgeMove = transformedMove(fen, transform, 'd1', 'h5')
    const edge = scoreTwoBishopsWhiteMove(fen, edgeMove)
    const offEdge = scoreTwoBishopsWhiteMove(fen, offEdgeMove)
    const near = scoreTwoBishopsWhiteMove(fen, nearMove)
    const innerEdge = scoreTwoBishopsWhiteMove(fen, innerEdgeMove)
    assert.equal(edgeDistance(transformSquare('h6', transform)), 0)
    assert.equal(kingDistance(transformSquare('h6', transform), transformSquare('g3', transform)), 3)
    assert.equal(edge.ruleR6DiagonalPenalty, 0, transform.name)
    assert.deepEqual(priorities(edge), [4, 1, 1], transform.name)
    assert.deepEqual(priorities(near), [4, 0, 1], transform.name)
    assert.deepEqual(priorities(offEdge), [4, 0, 1], transform.name)
    assert.deepEqual(priorities(innerEdge), [4, 0, 1], transform.name)
    assert.ok(compareScoresByRules(offEdge, edge, [r10]) < 0, transform.name)
    assert.equal(compareScoresByRules(offEdge, near, [r10]), 0, transform.name)
    assert.equal(compareScoresByRules(offEdge, innerEdge, [r10]), 0, transform.name)
  }
})

test('r10 prefers the outer bishop off the target corner edge regardless of its distance from Black', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const cases = [
      { to: 'c3', steps: 2, penalty: 0 },
      { to: 'f6', steps: 3, penalty: 0 },
      { to: 'g7', steps: 4, penalty: 0 },
      { to: 'h8', steps: 5, penalty: 1 },
      { to: 'a1', steps: 4, penalty: 1 },
    ] as const
    const scored = cases.map(({ to, steps, penalty }) => {
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'b2', to))
      assert.equal(kingDistance(transformSquare(to, transform), transformSquare('e3', transform)),
        steps, `${transform.name}: ${to}`)
      assert.deepEqual(priorities(score), [6, penalty, 2], `${transform.name}: ${to}`)
      return score
    })
    assert.equal(compareScoresByRules(scored[1]!, scored[0]!, [r10]), 0, transform.name)
    assert.equal(compareScoresByRules(scored[1]!, scored[2]!, [r10]), 0, transform.name)
    assert.ok(compareScoresByRules(scored[0]!, scored[3]!, [r10]) < 0, transform.name)
  }
})

test('an outer bishop off the target corner edge takes priority over a closer White king target', () => {
  const starting = '8/7B/5K2/8/8/5k2/8/2B5 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const bishop = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'h7', 'g6'))
    const king = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'e5'))
    assert.deepEqual(priorities(bishop), [5, 0, 2], transform.name)
    assert.deepEqual(priorities(king), [5, 1, 1], transform.name)
    assert.ok(compareScoresByRules(bishop, king, [r10]) < 0, transform.name)
    assert.equal(firstDifferingRule(bishop, king, twoBishopsWhiteRules)?.id,
      'rule r10', transform.name)
  }
})

test('r10 rejects Bb1 on the target corner edge before r19 can reward its distance', () => {
  const starting = '8/8/7B/8/4K3/8/2B5/4k3 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const bishopMove = transformedMove(fen, transform, 'c2', 'b1')
    const kingMove = transformedMove(fen, transform, 'e4', 'd3')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    const king = candidates.find(({ san }) => san === kingMove)!
    // Bh6 is the inner bishop on c1–h6. Bc2/Bb1 is the outer bishop
    // on b1–h7, and h1 is the target corner. Rank 1 is its edge.
    assert.equal(kingDistance(transformSquare('b1', transform),
      transformSquare('e1', transform)), 3, transform.name)
    assert.equal(kingDistance(transformSquare('c2', transform),
      transformSquare('e1', transform)), 2, transform.name)
    assert.deepEqual(priorities(bishop.score), [5, 1, 1], transform.name)
    assert.deepEqual(priorities(king.score), [5, 0, 1], transform.name)
    assert.equal(bishop.score.ruleR19Penalty, 0, transform.name)
    assert.equal(king.score.ruleR19Penalty, 1, transform.name)
    assert.equal(firstDifferingRule(king.score, bishop.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.equal(selection.eliminatedBy.get(bishop)?.id, 'rule r10', transform.name)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [kingMove],
      transform.name)
  }
})

test('r10 selects Ke5 over Kf5 because its closest target remains unscreened', () => {
  const starting = '8/8/5KB1/8/8/5k2/8/2B5 w - - 26 14'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const straightMove = transformedMove(fen, transform, 'f6', 'e5')
    const diagonalMove = transformedMove(fen, transform, 'f6', 'f5')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const straight = candidates.find(({ san }) => san === straightMove)!
    const diagonal = candidates.find(({ san }) => san === diagonalMove)!
    const target = transformSquare('e4', transform)
    for (const candidate of [straight, diagonal]) {
      assert.deepEqual(candidate.score.ruleR10TargetSquares,
        candidate === diagonal ? [] : [target], transform.name)
    }
    assert.equal(kingDistance(transformSquare('e5', transform), target), 1, transform.name)
    assert.equal(kingDistance(transformSquare('f5', transform), target), 1, transform.name)
    assert.deepEqual(priorities(straight.score), [5, 0, 1], transform.name)
    assert.deepEqual(priorities(diagonal.score), [5, 0, 99], transform.name)
    assert.equal(firstDifferingRule(straight.score, diagonal.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    assert.ok(compareScoresByRules(straight.score, diagonal.score, [r10]) < 0,
      transform.name)
    // Inner Bc1 favors d3, while outer Bg6 favors f5.
    assert.equal(straight.score.ruleR9Applies, false, transform.name)
    assert.equal(diagonal.score.ruleR9Applies, false, transform.name)
    assert.deepEqual(diagonal.score.ruleR9TargetSquares, [], transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.equal(selection.eliminatedBy.get(diagonal)?.id, 'rule r10', transform.name)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [straightMove],
      transform.name)
  }
})
