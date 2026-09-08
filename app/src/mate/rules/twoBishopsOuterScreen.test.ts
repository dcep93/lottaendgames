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

test('r10 rejects Kd5 as an outer-wall screen and selects Ke5 in every orientation', () => {
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
    assert.equal(screened.score.ruleR10DiagonalCount, 99, transform.name)
    assert.equal(intact.score.ruleR10DiagonalCount, 5, transform.name)
    assert.equal(firstDifferingRule(screened.score, intact.score,
      twoBishopsWhiteRules)?.id, 'rule r10', transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.deepEqual(selection.idealCandidates.map(({ san }) => san),
      [intactMove], transform.name)
    assert.equal(selection.eliminatedBy.get(screened)?.id, 'rule r10', transform.name)
    const tiedMove = transformedMove(fen, transform, 'e4', 'f5')
    const tied = candidates.find(({ san }) => san === tiedMove)!
    assert.equal(selection.eliminatedBy.get(tied)?.id, 'rule r25', transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r25', transform.name)

    // Invalidating the enclosure does not discard its target/beyond geometry.
    for (const candidate of [screened, intact]) {
      assert.deepEqual(candidate.score.ruleR10TargetSquares,
        [transformSquare('e6', transform)], transform.name)
      assert.equal(candidate.score.ruleR10KingDistance, 1, transform.name)
    }
    assert.equal(screened.score.ruleR12KingDistance, 1, transform.name)
    assert.equal(intact.score.ruleR12KingDistance, 0, transform.name)
  }
})

test('the screened outer wall fails even before Black can immediately cross it', () => {
  const chess = getChess(startingFen)
  chess.move('Kd5')
  assert.deepEqual(chess.moves().sort(), ['Kc7', 'Kc8', 'Kd8', 'Ke8'])
  assert.equal(chess.isAttacked('f7', 'w'), false)
  // Freeze White only to demonstrate the hole in a2-g8, not a policy replay.
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

test('an outer-wall king one square from the edge or at its endpoint preserves the enclosure', () => {
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

test('bishop moves retain an invalid enclosure while White remains on the central outer wall', () => {
  const starting = getChess(startingFen)
  starting.move('Kd5')
  const fields = starting.fen().split(' ')
  fields[1] = 'w'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(fields.join(' '), transform)
    for (const to of ['a2', 'c4'] as const) {
      const move = transformedMove(fen, transform, 'b3', to)
      assert.equal(scoreTwoBishopsWhiteMove(fen, move).ruleR10DiagonalCount,
        99, `${transform.name}: ${to}`)
    }
  }
})

test('screening one outer wall leaves a valid wall in the other orientation available', () => {
  const starting = '8/2k5/8/3B4/3B4/8/2K5/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const screenedMove = transformedMove(fen, transform, 'c2', 'c3')
    const intactMove = transformedMove(fen, transform, 'c2', 'd3')
    // Kc3 screens a1-h8, invalidating the six-diagonal enclosure. The other
    // pair, a7-g1/a8-h1, still encloses Black on seven diagonals.
    const screened = scoreTwoBishopsWhiteMove(fen, screenedMove)
    assert.equal(screened.ruleR10DiagonalCount, 7, transform.name)
    assert.deepEqual(screened.ruleR10TargetSquares,
      [transformSquare('b6', transform)], transform.name)
    assert.equal(scoreTwoBishopsWhiteMove(fen, intactMove).ruleR10DiagonalCount,
      6, transform.name)
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
