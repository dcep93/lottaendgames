import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  kingDistance,
  squaredEuclideanDistance,
  transformFen,
  transformSquare,
  type SquareTransform,
} from '../chess'
import { compareScoresByRules, firstDifferingRule, selectCandidatesByRules } from './selection'
import { analyzeTwoBishopsWhiteSelection, scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'

const loadedFen = '1BB5/8/8/6K1/8/8/6k1/8 w - - 28 15'
const r9 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r9')!

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

test('opposition r9 precedes r10 and the removed r18.5 has no rule or score fields', () => {
  assert.deepEqual(twoBishopsWhiteRules.map(({ id }) => id), [
    'mate', 'bishops safe', 'no stalemate', 'rule r1', 'rule r3', 'rule r4', 'rule r5',
    'rule r5.5', 'rule r6', 'rule r6.2', 'rule r6.4', 'rule r7', 'rule r8', 'rule r9', 'rule r10', 'rule r19', 'rule r24', 'rule r24.5', 'rule r25', 'rule r30',
  ])
  const fen = '8/8/2k5/B7/4K3/8/8/5B2 w - - 6 4'
  for (const san of getChess(fen).moves()) {
    assert.deepEqual(Object.keys(scoreTwoBishopsWhiteMove(fen, san))
      .filter((key) => key.startsWith('ruleR18_5')), [], san)
  }
})

test('15 Kg4 takes opposition despite screening its closest r10 target', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const oppositionMove = transformedMove(fen, transform, 'g5', 'g4')
    const closerMove = transformedMove(fen, transform, 'g5', 'h4')
    const screenedMove = transformedMove(fen, transform, 'g5', 'f4')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const opposition = candidates.find(({ san }) => san === oppositionMove)!
    const closer = candidates.find(({ san }) => san === closerMove)!
    const screened = candidates.find(({ san }) => san === screenedMove)!
    // Black g2 shares an edge with inner b8–h2. The outer diagonal c8–h3
    // has just one on-board direct-opposition square, g4; i2 is off-board.
    for (const candidate of [opposition, closer]) {
      assert.equal(candidate.score.ruleR9Applies, true, transform.name)
      assert.deepEqual(candidate.score.ruleR9TargetSquares,
        [transformSquare('g4', transform)], transform.name)
      assert.equal(candidate.score.ruleR10DiagonalCount, 8, transform.name)
      assert.deepEqual(candidate.score.ruleR10TargetSquares,
        candidate === opposition ? [] : [transformSquare('h3', transform)], transform.name)
    }
    assert.equal(opposition.score.ruleR9Penalty, 0, transform.name)
    assert.equal(closer.score.ruleR9Penalty, 1, transform.name)
    assert.equal(opposition.score.ruleR10KingDistance, 99, transform.name)
    assert.equal(closer.score.ruleR10KingDistance, 1, transform.name)
    assert.equal(firstDifferingRule(opposition.score, closer.score,
      twoBishopsWhiteRules)?.id, 'rule r9', transform.name)
    // An invalid inner screen has no applicable r9 target. Accomplished
    // opposition now rejects that exempt move directly under r9.
    assert.equal(screened.score.ruleR9Applies, false, transform.name)
    assert.ok(!selectCandidatesByRules(candidates, [r9]).idealCandidates.includes(screened),
      transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [oppositionMove], transform.name)
    assert.equal(selection.eliminatedBy.get(closer)?.id, 'rule r9', transform.name)
    assert.equal(selection.eliminatedBy.get(screened)?.id, 'rule r8', transform.name)
  }
})

test('both bishops prefer the same opposition square in either direction', () => {
  const cases = [
    { fen: '1BB5/8/5K2/8/4k3/8/8/8 w - - 0 1', from: 'f6', to: 'e6', bishops: ['b8', 'c8'] },
    { fen: '8/8/8/7K/4k3/7B/7B/8 w - - 0 1', from: 'h5', to: 'g4', bishops: ['h2', 'h3'] },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, fixture.from, fixture.to))
      const target = transformSquare(fixture.to, transform)
      const other = transformSquare(fixture.to === 'e6' ? 'g4' : 'e6', transform)
      for (const square of fixture.bishops) {
        const bishop = transformSquare(square, transform)
        assert.ok(squaredEuclideanDistance(target, bishop) < squaredEuclideanDistance(other, bishop),
          `${transform.name}: ${square}`)
      }
      assert.equal(score.ruleR9Applies, true, transform.name)
      assert.deepEqual(score.ruleR9TargetSquares, [target], transform.name)
      assert.equal(score.ruleR9Penalty, 0, transform.name)
    }
  }
})

test('a tie for the outer bishop leaves no target even when the inner bishop prefers one square', () => {
  const cases = [
    { fen: '1B6/8/4K3/8/4k1B1/8/8/8 w - - 0 1', from: 'g4', target: 'e6', inner: 'b8' },
    { fen: '8/8/4B3/8/4k1K1/8/7B/8 w - - 0 1', from: 'e6', target: 'g4', inner: 'h2' },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, fixture.from, 'f5'))
      // Bf5 is equidistant from e6 and g4. The inner bishop prefers one, but the outer tie prevents r9 credit.
      assert.equal(kingDistance(transformSquare('e4', transform),
        transformSquare('f5', transform)), 1, transform.name)
      for (const square of ['e6', 'g4'] as const) {
        assert.equal(squaredEuclideanDistance(transformSquare(square, transform),
          transformSquare('f5', transform)), 2, transform.name)
      }
      const target = transformSquare(fixture.target, transform)
      const other = transformSquare(fixture.target === 'e6' ? 'g4' : 'e6', transform)
      const inner = transformSquare(fixture.inner, transform)
      assert.ok(squaredEuclideanDistance(target, inner) < squaredEuclideanDistance(other, inner),
        transform.name)
      assert.deepEqual(score.ruleR9TargetSquares, [], transform.name)
      assert.equal(score.ruleR9Applies, false, transform.name)
      assert.equal(score.ruleR9Penalty, 1, transform.name)
    }
  }
})

test('r9 rewards occupying opposition rather than approaching an unreachable target', () => {
  const starting = '1B6/1B6/8/8/7K/4k3/8/8 w - - 32 17'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const scores = ['g3', 'g4', 'h5'].map((to) => scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'h4', to as Square)))
    // Outer b8–h2 admits e5 and g3, but e5 is closer to both bishops. None of
    // these king moves reaches e5; even arrival on farther g3 gets no bonus.
    for (const score of scores) {
      assert.equal(score.ruleR9Applies, true, transform.name)
      assert.deepEqual(score.ruleR9TargetSquares, [transformSquare('e5', transform)], transform.name)
      assert.equal(score.ruleR9Penalty, 1, transform.name)
    }
    assert.equal(compareScoresByRules(scores[0]!, scores[1]!, [r9]), 0, transform.name)
    assert.equal(compareScoresByRules(scores[1]!, scores[2]!, [r9]), 0, transform.name)
  }
})

test('resulting bishop moves can preserve opposition and occupied target candidates remain eligible', () => {
  const onTargetFen = '1BB5/8/8/8/6K1/8/6k1/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const onTarget = transformFen(onTargetFen, transform)
    const preserved = scoreTwoBishopsWhiteMove(onTarget,
      transformedMove(onTarget, transform, 'c8', 'd7'))
    assert.deepEqual(preserved.ruleR9TargetSquares, [transformSquare('g4', transform)], transform.name)
    assert.equal(preserved.ruleR9Penalty, 0, transform.name)

    const fen = transformFen(loadedFen, transform)
    const occupiedMove = transformedMove(fen, transform, 'c8', 'g4')
    const occupied = scoreTwoBishopsWhiteMove(fen, occupiedMove)
    const result = getChess(fen)
    result.move(occupiedMove)
    assert.equal(result.get(transformSquare('g4', transform))?.type, 'b', transform.name)
    assert.equal(occupied.ruleR9Applies, true, transform.name)
    assert.deepEqual(occupied.ruleR9TargetSquares, [transformSquare('g4', transform)], transform.name)
    assert.equal(occupied.ruleR9Penalty, 1, transform.name)
  }
})

test('edge adjacency and qualified result walls are required', () => {
  const cases = [
    // Black f2 is diagonally adjacent to the inner wall, not edge adjacent.
    { fen: '1BB5/8/8/6K1/8/8/5k2/8 w - - 0 1', from: 'g5', to: 'g4', count: 8 },
    // Kf4 screens the inner wall; Ba7 breaks the paired-wall geometry.
    { fen: loadedFen, from: 'g5', to: 'f4', count: 99 },
    { fen: loadedFen, from: 'b8', to: 'a7', count: 99 },
    // Bf3 permits Kc4 to cross beyond both walls.
    { fen: '8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11', from: 'e2', to: 'f3', count: 99 },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, fixture.from, fixture.to))
      assert.equal(score.ruleR10DiagonalCount, fixture.count, transform.name)
      assert.equal(score.ruleR9Applies, false, transform.name)
      assert.deepEqual(score.ruleR9TargetSquares, [], transform.name)
      assert.equal(score.ruleR9Penalty, 1, transform.name)
    }
  }
})

test('smallest walls and outside-wall ties are selected before testing edge adjacency', () => {
  const cases = [
    {
      // The a8 wall has seven diagonals and Black is not edge adjacent.
      // The larger a1 wall has nine and is edge adjacent, but cannot replace it.
      fen: '8/2k3K1/5B2/5B2/8/8/8/8 w - - 0 1', from: 'g7', to: 'g8', count: 7,
    },
    {
      // Both walls leave five diagonals. White is outside the h8 wall and
      // inside the h1 wall, so the edge-adjacent h1 wall is excluded first.
      fen: '8/8/8/5B1k/5B2/8/4K3/8 w - - 0 1', from: 'e2', to: 'f3', count: 5,
    },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, fixture.from, fixture.to))
      assert.equal(score.ruleR10DiagonalCount, fixture.count, transform.name)
      assert.equal(score.ruleR9Applies, false, transform.name)
      assert.deepEqual(score.ruleR9TargetSquares, [], transform.name)
    }
  }
})

test('an unreachable opposition target does not stop Bb5 reducing Black from ten diagonals to nine', () => {
  const starting = '8/4k3/8/B7/B3K3/8/8/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const bishopMove = transformedMove(fen, transform, 'a4', 'b5')
    const kingMove = transformedMove(fen, transform, 'e4', 'd3')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    const king = candidates.find(({ san }) => san === kingMove)!
    assert.equal(bishop.score.ruleR9Applies, false, transform.name)
    assert.equal(king.score.ruleR9Applies, true, transform.name)
    assert.deepEqual(king.score.ruleR9TargetSquares, [transformSquare('c7', transform)], transform.name)
    assert.equal(king.score.ruleR9Penalty, 1, transform.name)
    assert.equal(compareScoresByRules(bishop.score, king.score, [r9]), 0, transform.name)
    assert.equal(bishop.score.ruleR10DiagonalCount, 9, transform.name)
    assert.equal(king.score.ruleR10DiagonalCount, 10, transform.name)
    assert.equal(firstDifferingRule(bishop.score, king.score,
      twoBishopsWhiteRules)?.id, 'rule r8', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [bishopMove], transform.name)
  }
})

test('Kd6 benefits from an unreachable inner screen while Kd5 screens its targets', () => {
  const starting = '3k4/8/2K5/8/1B6/1B6/8/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const kingMove = transformedMove(fen, transform, 'c6', 'd5')
    const bishopMove = transformedMove(fen, transform, 'b4', 'a3')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const king = candidates.find(({ san }) => san === kingMove)!
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    assert.equal(king.score.ruleR9Applies, false, transform.name)
    assert.equal(bishop.score.ruleR9Applies, false, transform.name)
    assert.equal(king.score.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(bishop.score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(king.score.ruleR10TargetSquares, [], transform.name)
    assert.equal(king.score.ruleR10KingDistance, 99, transform.name)
    assert.equal(bishop.score.ruleR10KingDistance, 2, transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [transformedMove(fen, transform, 'c6', 'd6')], transform.name)
  }
})

test('disagreeing bishops leave no opposition target, so r10 chooses Ke4 with an unscreened target', () => {
  const starting = '8/2B5/8/3K2k1/8/7B/8/8 w - - 18 10'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const oppositionMove = transformedMove(fen, transform, 'd5', 'e5')
    const closerMove = transformedMove(fen, transform, 'd5', 'e4')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const opposition = candidates.find(({ san }) => san === oppositionMove)!
    const closer = candidates.find(({ san }) => san === closerMove)!
    // Inner c8–h3 and outer b8–h2 enclose five diagonals toward h8.
    // Ke5 reaches opposition, but outer Bc7 prefers e5 while inner Bh3
    // prefers g3. No square minimizes both bishop distances.
    const inner = transformSquare('h3', transform)
    const outer = transformSquare('c7', transform)
    assert.equal(squaredEuclideanDistance(transformSquare('e5', transform), inner), 13, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('g3', transform), inner), 1, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('e5', transform), outer), 8, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('g3', transform), outer), 32, transform.name)
    for (const candidate of [opposition, closer]) {
      assert.equal(candidate.score.ruleR9Applies, false, transform.name)
      assert.deepEqual(candidate.score.ruleR9TargetSquares, [], transform.name)
      assert.equal(candidate.score.ruleR9Penalty, 1, transform.name)
      // Only the r9 bonus disappears: the existing wall remains valid.
      assert.equal(candidate.score.ruleR10DiagonalCount, 5, transform.name)
      assert.deepEqual(candidate.score.ruleR10TargetSquares,
        candidate === opposition ? [] : [transformSquare('f4', transform)], transform.name)
    }
    assert.equal(opposition.score.ruleR10KingDistance, 99, transform.name)
    assert.equal(closer.score.ruleR10KingDistance, 1, transform.name)
    assert.equal(firstDifferingRule(closer.score, opposition.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [closerMove], transform.name)
    assert.equal(selection.eliminatedBy.get(opposition)?.id, 'rule r10', transform.name)
  }
})

test('an outer bishop on the target-corner edge exempts otherwise agreed opposition', () => {
  const starting = '8/2B5/8/8/7k/7B/6K1/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = transformedMove(fen, transform, 'c7', 'h2')
    const score = scoreTwoBishopsWhiteMove(fen, san)
    const result = getChess(fen)
    result.move(san)
    const inner = transformSquare('h3', transform)
    assert.equal(kingDistance(transformSquare('h4', transform), inner), 1, transform.name)
    assert.equal(kingDistance(transformSquare('g2', transform), inner), 1, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('h4', transform), inner), 1, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('g2', transform), inner), 2, transform.name)
    assert.equal(result.isAttacked(inner, 'w'), true, transform.name)
    // Both bishops favor h2, but the resulting outer bishop occupies that
    // square on the h8 target corner’s edge, so r9 has no target.
    assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(score.ruleR9Applies, false, transform.name)
    assert.deepEqual(score.ruleR9TargetSquares, [], transform.name)
    assert.equal(score.ruleR9Penalty, 1, transform.name)
  }
})

test('moving the inner bishop makes both bishops agree after the move even if Black could attack it', () => {
  const cases = [
    { fen: '8/2B5/8/3K2k1/8/7B/8/8 w - - 18 10', penalty: 1 },
    { fen: '8/2B5/8/4K1k1/8/7B/8/8 w - - 0 1', penalty: 0 },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const san = transformedMove(fen, transform, 'h3', 'e6')
      const score = scoreTwoBishopsWhiteMove(fen, san)
      const result = getChess(fen)
      result.move(san)
      const inner = transformSquare('e6', transform)
      assert.equal(squaredEuclideanDistance(transformSquare('e5', transform), inner), 1, transform.name)
      assert.equal(squaredEuclideanDistance(transformSquare('g3', transform), inner), 13, transform.name)
      if (fixture.penalty === 1) {
        const reply = transformSquare('f6', transform)
        assert.ok(result.moves({ verbose: true }).some(({ to }) => to === reply), transform.name)
        assert.equal(kingDistance(reply, inner), 1, transform.name)
      }
      assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
      assert.equal(score.ruleR9Applies, true, transform.name)
      assert.deepEqual(score.ruleR9TargetSquares, [transformSquare('e5', transform)], transform.name)
      assert.equal(score.ruleR9Penalty, fixture.penalty, transform.name)
    }
  }
})

test('moving the outer bishop makes both bishops prefer g3 regardless of the kings distances', () => {
  const starting = '8/2B5/8/3K2k1/8/7B/8/8 w - - 18 10'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = transformedMove(fen, transform, 'c7', 'g3')
    const score = scoreTwoBishopsWhiteMove(fen, san)
    const result = getChess(fen)
    result.move(san)
    const inner = transformSquare('h3', transform)
    const oldThreat = transformSquare('h4', transform)
    assert.equal(result.get(inner)?.type, 'b', transform.name)
    assert.equal(result.isAttacked(oldThreat, 'w'), true, transform.name)
    assert.ok(!result.moves({ verbose: true }).some(({ to }) => to === oldThreat), transform.name)
    assert.ok(result.moves({ verbose: true }).every(({ to }) =>
      kingDistance(to, inner) > 1), transform.name)
    // The unchanged inner bishop is still closer to Black than to White,
    // but both bishops now prefer g3 to the alternative e5.
    assert.equal(squaredEuclideanDistance(transformSquare('g5', transform), inner), 5, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('d5', transform), inner), 20, transform.name)
    assert.equal(score.ruleR9Applies, true, transform.name)
    assert.deepEqual(score.ruleR9TargetSquares, [transformSquare('g3', transform)], transform.name)
    assert.equal(score.ruleR9Penalty, 1, transform.name)
  }
})

test('a sole on-board opposition candidate qualifies without comparing either king to the bishops', () => {
  const starting = '2B5/8/8/8/7K/6B1/6k1/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'c8', 'd7'))
    const inner = transformSquare('g3', transform)
    assert.equal(squaredEuclideanDistance(transformSquare('g2', transform), inner), 1, transform.name)
    assert.equal(squaredEuclideanDistance(transformSquare('h4', transform), inner), 2, transform.name)
    // g4 is on c8–h3 in direct opposition to g2; the other candidate i2
    // is off-board. The sole candidate minimizes each bishop's distance.
    assert.equal(score.ruleR10DiagonalCount, 8, transform.name)
    assert.equal(score.ruleR9Applies, true, transform.name)
    assert.deepEqual(score.ruleR9TargetSquares, [transformSquare('g4', transform)], transform.name)
    assert.equal(score.ruleR9Penalty, 1, transform.name)
  }
})


test('accomplished Ke4 opposition outranks exempt Bc1 before target proximity', () => {
  const starting = '8/8/6BB/4K3/8/8/4k3/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const kingMove = transformedMove(fen, transform, 'e5', 'e4')
    const bishopMove = transformedMove(fen, transform, 'h6', 'c1')
    const waitingMove = transformedMove(fen, transform, 'e5', 'd5')
    const candidates = getChess(fen).moves().map((san) => ({ san, score: scoreTwoBishopsWhiteMove(fen, san) }))
    const king = candidates.find(({ san }) => san === kingMove)!
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    const waiting = candidates.find(({ san }) => san === waitingMove)!
    assert.equal(king.score.ruleR9Applies, true, transform.name)
    assert.equal(king.score.ruleR9Penalty, 0, transform.name)
    assert.deepEqual(king.score.ruleR9TargetSquares, [transformSquare('e4', transform)], transform.name)
    assert.equal(bishop.score.ruleR9Applies, false, transform.name)
    assert.equal(bishop.score.ruleR9Penalty, 1, transform.name)
    assert.equal(waiting.score.ruleR9Applies, true, transform.name)
    assert.equal(waiting.score.ruleR9Penalty, 1, transform.name)
    assert.equal(compareScoresByRules(bishop.score, waiting.score, [r9]), 0, transform.name)
    assert.equal(selectCandidatesByRules([bishop, waiting], [r9]).idealCandidates.length, 2, transform.name)
    assert.equal(firstDifferingRule(king.score, bishop.score, twoBishopsWhiteRules)?.id, 'rule r9', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [kingMove], transform.name)
    assert.equal(selection.eliminatedBy.get(bishop)?.id, 'rule r9', transform.name)
  }
})


test('Bf4+ receives no r9 credit when e5 and g3 tie for the inner bishop', () => {
  for (const counters of ['0 1', '32 17', '98 50']) for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(`2B5/8/8/4K1k1/8/6B1/8/8 w - - ${counters}`, transform)
    const move = transformedMove(fen, transform, 'g3', 'f4')
    const score = scoreTwoBishopsWhiteMove(fen, move)
    for (const target of ['e5', 'g3'] as const) {
      assert.equal(squaredEuclideanDistance(transformSquare(target, transform),
        transformSquare('f4', transform)), 2)
    }
    assert.ok(squaredEuclideanDistance(transformSquare('e5', transform), transformSquare('c8', transform)) <
      squaredEuclideanDistance(transformSquare('g3', transform), transformSquare('c8', transform)))
    assert.deepEqual(score.ruleR9TargetSquares, [])
    assert.equal(score.ruleR9Applies, false)
    assert.equal(score.ruleR9Penalty, 1)
    assert.equal(score.ruleR10DiagonalCount, 5)
    assert.deepEqual(analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves,
      [transformedMove(fen, transform, 'e5', 'e4')])
  }
})
