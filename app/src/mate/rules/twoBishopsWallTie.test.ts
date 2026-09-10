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

test('equal smallest walls prefer White outside or on the outer wall, retaining ties within either class', () => {
  const cases = [
    { king: 'f3', corners: ['h8'], label: 'outside h8, inside h1' },
    { king: 'g3', corners: ['h8'], label: 'on the h8 outer wall, inside h1' },
    { king: 'e4', corners: ['h1', 'h8'], label: 'on the h1 outer wall, outside h8' },
    { king: 'h3', corners: ['h1', 'h8'], label: 'inside both walls' },
  ] as const
  for (const transform of SQUARE_TRANSFORMS) {
    const bishops = ['f4', 'f5'].map((square) => transformSquare(square as Square, transform))
    const black = transformSquare('h5', transform)
    // Both diagonal orientations leave Black five diagonals. The h8 wall
    // has outer b8-h2; the h1 wall has outer b1-h7.
    for (const fixture of cases) {
      const actual = getAdjacentDiagonalWallTargetCorners(bishops, black,
        transformSquare(fixture.king, transform))
      assert.deepEqual([...actual].sort(), fixture.corners
        .map((corner) => transformSquare(corner, transform)).sort(),
      `${transform.name}: ${fixture.label}`)
    }
    assert.deepEqual([...getAdjacentDiagonalWallTargetCorners(bishops, black)].sort(),
      ['h1', 'h8'].map((corner) => transformSquare(corner as Square, transform)).sort(),
      `${transform.name}: unspecified White king preserves both ties`)
  }
})

test('a larger wall with White outside cannot replace a smaller wall containing White', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    // Bh5/Bh6 leave nine diagonals toward a8 and eleven toward a1.
    // Kg8 is inside the smaller a8 wall and outside the larger a1 wall.
    const actual = getAdjacentDiagonalWallTargetCorners(
      ['h5', 'h6'].map((square) => transformSquare(square as Square, transform)),
      transformSquare('e7', transform), transformSquare('g8', transform))
    assert.deepEqual(actual, [transformSquare('a8', transform)], transform.name)
  }
})

test('the tied outside wall retains r10 targets and r19 prefers Bc7', () => {
  const starting = '8/8/8/5B1k/5B2/5K2/8/8 w - - 0 1'
  const r10 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r10')!
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const bishopMove = transformedMove(fen, transform, 'f4', 'c7')
    const kingMove = transformedMove(fen, transform, 'f3', 'e4')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const bishop = candidates.find(({ san }) => san === bishopMove)!
    const king = candidates.find(({ san }) => san === kingMove)!
    for (const candidate of [bishop, king]) {
      assert.equal(candidate.score.ruleR10DiagonalCount, 5, transform.name)
      assert.equal(candidate.score.ruleR10KingDistance, 1, transform.name)
      assert.deepEqual([...candidate.score.ruleR10TargetSquares].sort(),
        ['f4', 'g3'].map((square) => transformSquare(square as Square, transform)).sort(),
        transform.name)
    }
    // Both outer bishops are off the target corner's edges, so r10 ties.
    // Only Bc7 places the outer bishop at least three king steps from Black
    // for the later r19 preference.
    assert.equal(bishop.score.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(king.score.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(compareScoresByRules(bishop.score, king.score, [r10]), 0, transform.name)
    assert.equal(bishop.score.ruleR19Penalty, 0, transform.name)
    assert.equal(king.score.ruleR19Penalty, 1, transform.name)
    assert.equal(firstDifferingRule(bishop.score, king.score, twoBishopsWhiteRules)?.id,
      'rule r19', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [bishopMove], transform.name)
    assert.equal(selection.eliminatedBy.get(king)?.id, 'rule r19', transform.name)
  }
})
