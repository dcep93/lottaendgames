import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS,
  edgeDistance,
  getChess,
  squaredEuclideanDistance,
  transformFen,
  transformSquare,
  type SquareTransform,
} from '../chess'
import { firstDifferingRule, selectCandidatesByRules } from './selection'
import {
  getIdealTwoBishopsWhiteMoves,
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

const startingFen = '5B2/3k4/8/8/4K3/1B6/8/8 w - - 18 10'


test('r10 prefers Ke5 because Kd5 screens all its closest candidates', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(startingFen, transform)
    const screenedMove = transformedMove(fen, transform, 'e4', 'd5')
    const intactMove = transformedMove(fen, transform, 'e4', 'e5')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const screened = candidates.find(({ san }) => san === screenedMove)!
    const intact = candidates.find(({ san }) => san === intactMove)!
    assert.equal(screened.score.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(intact.score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(screened.score.ruleR10TargetSquares,
      [], transform.name)
    assert.equal(screened.score.ruleR10KingDistance, 99, transform.name)
    assert.equal(firstDifferingRule(screened.score, intact.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    assert.equal(screened.score.ruleR9Applies, false, transform.name)
    assert.equal(intact.score.ruleR9Applies, false, transform.name)
    assert.deepEqual(screened.score.ruleR9TargetSquares, [], transform.name)
    assert.deepEqual(intact.score.ruleR9TargetSquares, [], transform.name)
    assert.equal(screened.score.ruleR9Penalty, 1, transform.name)
    assert.equal(intact.score.ruleR9Penalty, 1, transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san),
      [intactMove], transform.name)
    assert.equal(selection.eliminatedBy.get(screened)?.id, 'rule r10', transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r10', transform.name)

    // Inner Bf8 prefers f7; outer Bb3 prefers d5. Neither opposition
    // candidate is closest to both bishops, even though d5 is occupied.
    const f7 = transformSquare('f7', transform)
    const d5 = transformSquare('d5', transform)
    const innerBishop = transformSquare('f8', transform)
    const outerBishop = transformSquare('b3', transform)
    assert.ok(squaredEuclideanDistance(f7, innerBishop) <
      squaredEuclideanDistance(d5, innerBishop), transform.name)
    assert.ok(squaredEuclideanDistance(d5, outerBishop) <
      squaredEuclideanDistance(f7, outerBishop), transform.name)

    // The permitted outer screen does not remove the target geometry.
    assert.deepEqual(intact.score.ruleR10TargetSquares,
      [transformSquare('e6', transform)], transform.name)
    assert.equal(intact.score.ruleR10KingDistance, 1, transform.name)
  }
})

test('r10 permits an uncontrolled outer ray while retaining its immediate Black-reply check', () => {
  const chess = getChess(startingFen)
  chess.move('Kd5')
  assert.equal(scoreTwoBishopsWhiteMove(startingFen, 'Kd5').ruleR10DiagonalCount, 5)
  assert.deepEqual(chess.moves().sort(), ['Kc7', 'Kc8', 'Kd8', 'Ke8'])
  assert.equal(chess.isAttacked('f7', 'w'), false)
  // Freeze White only to inspect the screened ray, not a policy replay.
  let from: Square = 'd7'
  for (const to of ['e8', 'f7', 'g6'] as const) {
    const fields = chess.fen().split(' ')
    fields[1] = 'b'
    chess.load(fields.join(' '))
    assert.ok(chess.move({ from, to }))
    from = to
  }
  const intact = getChess(startingFen)
  intact.move('Ke5')
  assert.equal(intact.isAttacked('f7', 'w'), true)
})

test('a controlled outer-wall tail or an empty endpoint tail preserves the enclosure', () => {
  const cases = [
    { fen: '5B2/8/6K1/1k6/8/1B6/8/8 w - - 0 1', from: 'g6', to: 'f7', edge: 1 },
    { fen: '5B2/5K2/8/1k6/8/1B6/8/8 w - - 0 1', from: 'f7', to: 'g8', edge: 0 },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const move = transformedMove(fen, transform, fixture.from, fixture.to)
      assert.equal(edgeDistance(transformSquare(fixture.to, transform)), fixture.edge)
      assert.equal(scoreTwoBishopsWhiteMove(fen, move).ruleR10DiagonalCount,
        5, `${transform.name}: ${fixture.to}`)
    }
  }
})

test('bishop moves retain a valid enclosure while White remains on the central outer wall', () => {
  const starting = getChess(startingFen)
  starting.move('Kd5')
  const fields = starting.fen().split(' ')
  fields[1] = 'w'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(fields.join(' '), transform)
    for (const to of ['a2', 'c4'] as const) {
      const move = transformedMove(fen, transform, 'b3', to)
      const score = scoreTwoBishopsWhiteMove(fen, move)
      assert.equal(score.ruleR10DiagonalCount, 5, `${transform.name}: ${to}`)
      assert.deepEqual(score.ruleR10TargetSquares,
        [], `${transform.name}: ${to}`)
    }
  }
})

test('inner and outer screens retain the smaller wall when Black cannot enter', () => {
  const cases = [
    { fen: '8/2k5/8/3B4/3B4/8/2K5/8 w - - 0 1', from: 'c2', to: 'c3' },
    { fen: '8/2k5/8/3B4/3B4/2K5/8/8 w - - 0 1', from: 'c3', to: 'c4' },
  ] as const
  for (const fixture of cases) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(fixture.fen, transform)
      const screenedMove = transformedMove(fen, transform, fixture.from, fixture.to)
      const intactMove = transformedMove(fen, transform, fixture.from, 'd3')
      // Kc3 screens outer a1-h8; Kc4 screens inner a2-g8. Both remain valid.
      const screened = scoreTwoBishopsWhiteMove(fen, screenedMove)
      const label = `${transform.name}: ${fixture.to}`
      assert.equal(screened.ruleR10DiagonalCount, 6, label)
      assert.deepEqual(screened.ruleR10TargetSquares,
        [transformSquare('e5', transform)], label)
      assert.equal(scoreTwoBishopsWhiteMove(fen, intactMove).ruleR10DiagonalCount,
        6, label)
    }
  }
})

test('unreachable inner and outer screens both retain their enclosures', () => {
  const starting = '8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const innerScreen = transformedMove(fen, transform, 'g6', 'h5')
    const outerScreen = transformedMove(fen, transform, 'f3', 'e4')
    // Bh5 leaves Kf3 screening inner d1-h5. Ke4 screens outer b1-h7.
    assert.equal(scoreTwoBishopsWhiteMove(fen, innerScreen).ruleR10DiagonalCount, 4, transform.name)
    const outer = scoreTwoBishopsWhiteMove(fen, outerScreen)
    assert.equal(outer.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(outer.ruleR10TargetSquares, [transformSquare('f5', transform)], transform.name)
    assert.equal(outer.ruleR10KingDistance, 1, transform.name)
  }
})

test('an inner-wall king retains the wall when it controls the only hidden square', () => {
  const starting = '8/6B1/8/8/7k/8/2BK4/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const move = transformedMove(fen, transform, 'g7', 'h6')
    const score = scoreTwoBishopsWhiteMove(fen, move)
    assert.equal(edgeDistance(transformSquare('d2', transform)), 1)
    const result = getChess(fen)
    result.move(move)
    assert.equal(result.isAttacked(transformSquare('c1', transform), 'w'), true, transform.name)
    assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
  }
})

test('wall qualification adds no global move guard and preserves the Phase 2 king walk', () => {
  assert.equal(twoBishopsWhiteRules.some(({ id }) => id === 'king wall'), false)
  const starting = '8/8/8/8/7k/4B3/4B3/5K2 w - - 4 3'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const move = transformedMove(fen, transform, 'f1', 'f2')
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [move], transform.name)
    assert.equal(scoreTwoBishopsWhiteMove(fen, move).ruleR6DiagonalPenalty,
      0, transform.name)
  }
})

test('Ke3 and Kf2 both keep the outer wall and Ke3 wins by target proximity', () => {
  const starting = '8/8/8/2B5/8/1k1B4/4K3/8 w - - 2 2'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const nearMove = transformedMove(fen, transform, 'e2', 'e3')
    const fartherMove = transformedMove(fen, transform, 'e2', 'f2')
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    const near = candidates.find(({ san }) => san === nearMove)!
    const farther = candidates.find(({ san }) => san === fartherMove)!
    for (const candidate of [near, farther]) {
      assert.equal(candidate.score.ruleR10DiagonalCount, 5, transform.name)
    }
    assert.deepEqual([...near.score.ruleR10TargetSquares].sort(),
      ['c5', 'd4'].map((square) => transformSquare(square as Square, transform)).sort(),
      transform.name)
    assert.deepEqual(farther.score.ruleR10TargetSquares, [transformSquare('d4', transform)],
      transform.name)
    assert.equal(near.score.ruleR10KingDistance, 1, transform.name)
    assert.equal(farther.score.ruleR10KingDistance, 2, transform.name)
    // Ke3 hides g1 without controlling it; Kf2 controls that hidden square.
    // Both are outer screens and therefore both count as bishop walls.
    for (const [move, controlled] of [[nearMove, false], [fartherMove, true]] as const) {
      const result = getChess(fen)
      result.move(move)
      assert.equal(result.isAttacked(transformSquare('g1', transform), 'w'), controlled,
        transform.name)
    }
    assert.equal(near.score.ruleR25KingDistance, 9, transform.name)
    assert.equal(farther.score.ruleR25KingDistance, 17, transform.name)
    assert.equal(firstDifferingRule(near.score, farther.score, twoBishopsWhiteRules)?.id,
      'rule r10', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san), [nearMove], transform.name)
    assert.equal(selection.eliminatedBy.get(farther)?.id, 'rule r10', transform.name)
  }
})
