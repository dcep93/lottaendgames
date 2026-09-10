import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
  type SquareTransform,
} from '../chess'
import { compareScoresByRules, firstDifferingRule, selectCandidatesByRules } from './selection'
import {
  getAdjacentDiagonalWallTargetCorners,
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
} from './twoBishops'

const loadedFen = '8/7k/8/8/7K/1B6/1B6/8 w - - 0 1'
const r24_5 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r24.5')!

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

test('r24.5 follows the moat rule and precedes king proximity', () => {
  const ids = twoBishopsWhiteRules.map(({ id }) => id)
  const index = ids.indexOf('rule r24.5')
  assert.deepEqual(ids.slice(index - 1, index + 2), ['rule r24', 'rule r24.5', 'rule r25'])
  assert.equal(r24_5.helpText, 'Prefer the White king closer to the diagonal one beyond the outer wall.')
})

test('r24.5 prefers Kg4 toward the beyond-wall diagonal after king-step targets tie', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const kingMove = transformedMove(fen, transform, 'h4', 'g4')
    const bishopMove = transformedMove(fen, transform, 'b3', 'a2')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const king = candidates.find(({ san }) => san === kingMove)!
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    for (const candidate of [king, bishop]) {
      assert.equal(candidate.score.ruleR10DiagonalCount, 7, transform.name)
      assert.equal(candidate.score.ruleR10OuterBishopPenalty, 0, transform.name)
      assert.deepEqual(candidate.score.ruleR10TargetSquares, [transformSquare('g8', transform)], transform.name)
    }
    // Beyond outer a2–g8 is a3–f8. Kg4 is 13 from d6/e7;
    // leaving White on h4 is 18 from e7.
    assert.equal(king.score.ruleR24_5KingDistance, 13, transform.name)
    assert.equal(bishop.score.ruleR24_5KingDistance, 18, transform.name)
    assert.equal(firstDifferingRule(king.score, bishop.score,
      twoBishopsWhiteRules)?.id, 'rule r24.5', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [kingMove], transform.name)
    assert.equal(selection.eliminatedBy.get(bishop)?.id, 'rule r24.5', transform.name)
    for (const to of ['g5', 'h5'] as const) {
      const san = transformedMove(fen, transform, 'h4', to)
      const candidate = candidates.find((entry) => entry.san === san)!
      const result = getChess(fen)
      result.move(san)
      assert.equal(result.isStalemate(), true, `${transform.name}: ${to}`)
      assert.equal(selection.eliminatedBy.get(candidate)?.id, 'no stalemate',
        `${transform.name}: ${to}`)
    }
  }
})

test('r24.5 gives zero on the beyond-wall diagonal and does not inherit the r10 floor', () => {
  const starting = '3k4/8/5K2/8/1B6/1B6/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const on = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'f7'))
    const adjacent = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f6', 'g7'))
    assert.equal(on.ruleR10KingDistance, 1, transform.name)
    assert.equal(adjacent.ruleR10KingDistance, 1, transform.name)
    assert.equal(on.ruleR24_5KingDistance, 1, transform.name)
    assert.equal(adjacent.ruleR24_5KingDistance, 0, transform.name)
    assert.ok(compareScoresByRules(on, adjacent, [r24_5]) > 0, transform.name)
    assert.equal(firstDifferingRule(on, adjacent,
      twoBishopsWhiteRules)?.id, 'rule r24.5', transform.name)
  }
})

test('bishop moves recalculate the selected wall and distance uses board squares', () => {
  const endpointFen = '8/4k3/8/B7/B6K/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loadedFen, transform)
    const movedWall = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'b2', 'a3'))
    // Ba3 changes outer a2–g8 into a3–f8: beyond is a4–e8, 25 away.
    assert.equal(movedWall.ruleR10DiagonalCount, 8, transform.name)
    assert.equal(movedWall.ruleR24_5KingDistance, 25, transform.name)

    const endpoint = transformFen(endpointFen, transform)
    const score = scoreTwoBishopsWhiteMove(endpoint,
      transformedMove(endpoint, transform, 'a5', 'b4'))
    // Beyond outer a4–d1 is a3–c1: c1 is closest to Kh4, 5² + 3².
    // A projection onto the infinite diagonal would run beyond the board.
    assert.equal(score.ruleR10DiagonalCount, 10, transform.name)
    assert.equal(score.ruleR24_5KingDistance, 34, transform.name)
  }
})

test('r24.5 uses the r10-selected wall instead of a closer wall with a worse target score', () => {
  const starting = '8/8/8/5B1k/5B2/5K2/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f3', 'e4'))
    assert.deepEqual([...getAdjacentDiagonalWallTargetCorners(
      ['f4', 'f5'].map((square) => transformSquare(square as Square, transform)),
      transformSquare('h5', transform), transformSquare('e4', transform),
    )].sort(), ['h1', 'h8'].map((square) => transformSquare(square as Square, transform)).sort(),
    transform.name)
    // Ke4 is on outer b1–h7 toward h1, but that wall has no eligible target.
    // R10 selects the h8 wall with outer b8–h2 and targets f4/g3 instead.
    // Its beyond diagonal a8–h1 contains e4.
    assert.deepEqual([...score.ruleR10TargetSquares].sort(),
      ['f4', 'g3'].map((square) => transformSquare(square as Square, transform)).sort(),
      transform.name)
    assert.equal(score.ruleR10KingDistance, 1, transform.name)
    assert.equal(score.ruleR24_5KingDistance, 0, transform.name)
  }
})

test('r10 target proximity selects the nearer outer wall regardless of axis iteration order', () => {
  const starting = '8/8/8/5B1k/5B2/8/6K1/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'g2', 'h3'))
    // Both enclosures leave five diagonals and off-edge outer bishops.
    // The nearer enclosure also supplies the nearer target. Its beyond diagonal
    // is a8–h1; g2 is two squared units from Kh3.
    assert.deepEqual([...getAdjacentDiagonalWallTargetCorners(
      ['f4', 'f5'].map((square) => transformSquare(square as Square, transform)),
      transformSquare('h5', transform), transformSquare('h3', transform),
    )].sort(), ['h1', 'h8'].map((square) => transformSquare(square as Square, transform)).sort(),
    transform.name)
    assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(score.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.deepEqual([...score.ruleR10TargetSquares].sort(), (['f4', 'g3'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.equal(score.ruleR24_5KingDistance, 2, transform.name)
  }
})

test('outer screens preserve the beyond-diagonal score while absent or escaped walls give 99', () => {
  const outerFen = '3k4/8/2K5/8/1B6/1B6/8/8 w - - 2 2'
  const invalid = [
    { fen: '8/3k4/8/4K3/8/8/B6B/8 w - - 0 1', from: 'e5', to: 'd5' },
    { fen: '8/8/8/8/8/6k1/3BK3/3B4 w - - 0 1', from: 'd2', to: 'e3' },
    { fen: '8/8/8/3k4/8/8/4B3/2K3B1 w - - 20 11', from: 'e2', to: 'f3' },
  ] as const
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(outerFen, transform)
    const san = transformedMove(fen, transform, 'c6', 'd5')
    const outer = scoreTwoBishopsWhiteMove(fen, san)
    const result = getChess(fen)
    result.move(san)
    assert.equal(result.isAttacked(transformSquare('f7', transform), 'w'), false, transform.name)
    assert.equal(outer.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(outer.ruleR24_5KingDistance, 1, transform.name)
    for (const fixture of invalid) {
      const transformedFen = transformFen(fixture.fen, transform)
      const score = scoreTwoBishopsWhiteMove(transformedFen,
        transformedMove(transformedFen, transform, fixture.from, fixture.to))
      assert.equal(score.ruleR10DiagonalCount, 99, transform.name)
      assert.equal(score.ruleR24_5KingDistance, 99, transform.name)
      assert.equal(r24_5.applies?.(score), false, transform.name)
    }
  }
})


test('Kd7 reaches one beyond the outer wall and replaces the Bc7 loop move', () => {
  const starting = '1B6/8/k2K4/8/8/8/6B1/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const kingSan = transformedMove(fen, transform, 'd6', 'd7')
    const bishopSan = transformedMove(fen, transform, 'b8', 'c7')
    const king = scoreTwoBishopsWhiteMove(fen, kingSan)
    const bishop = scoreTwoBishopsWhiteMove(fen, bishopSan)
    // Outer b8–h2; one beyond away from a1 is c8–h3, containing d7.
    assert.equal(king.ruleR24_5KingDistance, 0, transform.name)
    assert.equal(bishop.ruleR24_5KingDistance, 1, transform.name)
    assert.equal(firstDifferingRule(king, bishop, twoBishopsWhiteRules)?.id, 'rule r24.5', transform.name)
    const candidates = getChess(fen).moves().map(san => ({san, score: scoreTwoBishopsWhiteMove(fen, san)}))
    assert.deepEqual(selectCandidatesByRules(candidates, twoBishopsWhiteRules).idealCandidates.map(c => c.san), [kingSan], transform.name)
  }
})
