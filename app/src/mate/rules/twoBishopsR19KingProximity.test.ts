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
import { compareScoresByRules, selectCandidatesByRules } from './selection'
import { scoreTwoBishopsWhiteMove, twoBishopsWhiteRules } from './twoBishops'

const r19 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r19')!
const proximityFen = '8/8/4K3/8/8/4k3/1B6/1B6 w - - 42 22'

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

test('r19 has a conditional king-proximity gate and remains between r10 and r24', () => {
  const index = twoBishopsWhiteRules.indexOf(r19)
  assert.deepEqual(twoBishopsWhiteRules.slice(index - 1, index + 2).map(({ id }) => id),
    ['rule r10', 'rule r19', 'rule r24'])
  assert.equal(r19.helpText,
    "If the white King is on or adjacent to the outer diagonal, prefer the outer bishop at least 3 steps away from Black's king.")
  assert.equal(typeof r19.applies, 'function')
})

test('the loaded position keeps r19 inactive and selects Ke6', () => {
  const starting = '8/1B3K2/8/8/5k2/8/5B2/8 w - - 6 4'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    // The selected outer a7-g1 diagonal remains at least two king steps
    // away, even when a bishop is moved three or more steps from Black.
    for (const { san, score } of candidates) {
      assert.equal(score.ruleR19Applies, false, `${transform.name}: ${san}`)
      assert.equal(score.ruleR19Penalty, 1, `${transform.name}: ${san}`)
    }
    assert.deepEqual(selectCandidatesByRules(candidates, [r19]).idealCandidates, candidates,
      transform.name)
    assert.deepEqual(selectCandidatesByRules(candidates, twoBishopsWhiteRules)
      .idealCandidates.map(({ san }) => san),
    [transformedMove(fen, transform, 'f7', 'e6')], transform.name)
  }
})

test('on-wall and orthogonal or diagonal adjacency qualify, but two king steps do not', () => {
  const outerDiagonal: readonly Square[] = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8']
  const cases = [
    { to: 'e5', distance: 0, applies: true },
    { to: 'd5', distance: 1, applies: true },
    // d6 can reach e5 diagonally; no orthogonal step reaches a1-h8.
    { to: 'd6', distance: 1, applies: true },
    { to: 'd7', distance: 2, applies: false },
  ] as const
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(proximityFen, transform)
    const diagonal = outerDiagonal.map((square) => transformSquare(square, transform))
    for (const fixture of cases) {
      const to = transformSquare(fixture.to, transform)
      assert.equal(Math.min(...diagonal.map((square) => kingDistance(to, square))),
        fixture.distance, `${transform.name}: ${fixture.to}`)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'e6', fixture.to))
      assert.equal(score.ruleR19Applies, fixture.applies,
        `${transform.name}: ${fixture.to}`)
      assert.equal(score.ruleR19Penalty, fixture.applies ? 0 : 1,
        `${transform.name}: ${fixture.to}`)
    }
  }
})

test('king proximity is measured after the king moves toward or away from the wall', () => {
  const starting = '8/3K4/8/8/8/4k3/1B6/1B6 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    // White starts two steps from a1-h8. Ke6 becomes diagonally adjacent;
    // Kc6 stays two steps away even though the outer bishop is remote.
    const near = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'd7', 'e6'))
    const far = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'd7', 'c6'))
    assert.equal(near.ruleR19Applies, true, transform.name)
    assert.equal(near.ruleR19Penalty, 0, transform.name)
    assert.equal(far.ruleR19Applies, false, transform.name)
  }
})

test('only actual on-board outer squares count near a diagonal endpoint', () => {
  const starting = 'k7/2BB1K2/8/8/8/8/8/8 w - - 0 1'
  const outerDiagonal: readonly Square[] = ['a4', 'b5', 'c6', 'd7', 'e8']
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const diagonal = outerDiagonal.map((square) => transformSquare(square, transform))
    for (const [to, distance, applies] of [
      ['e8', 0, true], ['f8', 1, true], ['g8', 2, false],
    ] as const) {
      const target = transformSquare(to, transform)
      assert.equal(Math.min(...diagonal.map((square) => kingDistance(target, square))),
        distance, `${transform.name}: ${to}`)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'f7', to))
      // g8 would be diagonally adjacent to f9 on the infinite extension,
      // but the actual outer wall ends at e8.
      assert.equal(score.ruleR19Applies, applies, `${transform.name}: ${to}`)
    }
  }
})

test('three king steps meets the outer-bishop threshold and farther distances tie', () => {
  const cases = [
    { to: 'c3', distance: 2, penalty: 1 },
    { to: 'f6', distance: 3, penalty: 0 },
    { to: 'g7', distance: 4, penalty: 0 },
  ] as const
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(proximityFen, transform)
    const scores = cases.map((fixture) => {
      assert.equal(kingDistance(transformSquare(fixture.to, transform),
        transformSquare('e3', transform)), fixture.distance, transform.name)
      const score = scoreTwoBishopsWhiteMove(fen,
        transformedMove(fen, transform, 'b2', fixture.to))
      assert.equal(score.ruleR19Applies, true, transform.name)
      assert.equal(score.ruleR19Penalty, fixture.penalty, transform.name)
      return score
    })
    assert.ok(compareScoresByRules(scores[1]!, scores[0]!, [r19]) < 0, transform.name)
    assert.equal(compareScoresByRules(scores[1]!, scores[2]!, [r19]), 0, transform.name)
  }
})

test('nonapplicable moves survive r19 while applicable moves below the threshold lose', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(proximityFen, transform)
    const candidates = [
      ['e6', 'd7'], // The king leaves the outer diagonal's neighborhood.
      ['b2', 'c3'], // White remains nearby, but the outer bishop is two away.
      ['b2', 'f6'], // White remains nearby, and the outer bishop is three away.
    ].map(([from, to]) => {
      const san = transformedMove(fen, transform, from as Square, to as Square)
      return { san, score: scoreTwoBishopsWhiteMove(fen, san) }
    })
    const [inactive, tooNear, remote] = candidates
    assert.equal(inactive!.score.ruleR19Applies, false, transform.name)
    assert.equal(inactive!.score.ruleR19Penalty, 1, transform.name)
    const selection = selectCandidatesByRules(candidates, [r19])
    assert.deepEqual(selection.idealCandidates, [inactive, remote], transform.name)
    assert.equal(selection.eliminatedBy.get(tooNear!)?.id, 'rule r19', transform.name)
    assert.equal(compareScoresByRules(inactive!.score, remote!.score, [r19]), 0,
      transform.name)
  }
})

test('a nearby larger wall cannot replace the selected smaller wall', () => {
  const starting = '8/4k1K1/7B/7B/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'g7', 'g8'))
    // The smaller a8 wall leaves nine diagonals and has outer d1-h5,
    // three steps from Kg8. The larger a1 wall leaves eleven and has
    // outer f8-h6, adjacent to Kg8; it must not activate r19.
    assert.equal(score.ruleR19Applies, false, transform.name)
    assert.equal(score.ruleR19Penalty, 1, transform.name)
  }
})

test('tied smallest walls prefer White not inside before applying the proximity gate', () => {
  const starting = '8/8/8/5B1k/5B2/5K2/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const far = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f3', 'e2'))
    // Ke2 is outside the h8 wall but two steps from its outer b8-h2.
    // It is inside the tied h1 wall and adjacent to that outer b1-h7.
    assert.equal(far.ruleR19Applies, false, transform.name)
    const near = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'f3', 'e4'))
    // Ke4 is not inside either wall, so both ties remain; both are near.
    assert.equal(near.ruleR19Applies, true, transform.name)
    assert.equal(near.ruleR19Penalty, 1, transform.name)
  }
})

test('bishop moves use the resulting outer diagonal and its new proximity to White', () => {
  const starting = '8/4k1K1/7B/7B/8/8/8/8 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const relocated = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'h5', 'g6'))
    const unchanged = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'h5', 'g4'))
    // Bg6 changes the selected outer diagonal to c1-h6. Kg7 is
    // diagonally adjacent to h6. Bg4 preserves the distant d1-h5 wall.
    assert.equal(relocated.ruleR19Applies, true, transform.name)
    assert.equal(relocated.ruleR19Penalty, 0, transform.name)
    assert.equal(unchanged.ruleR19Applies, false, transform.name)
  }
})

test('r19 retains its geometric-wall eligibility while no wall stays nonapplicable', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(proximityFen, transform)
    const screened = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'e6', 'f5'))
    // Kf5 screens inner b1-h7 but Black cannot enter it.
    // r19 still sees the geometric pair and the nearby outer a1-h8.
    assert.equal(screened.ruleR10DiagonalCount, 6, transform.name)
    assert.equal(screened.ruleR19Applies, true, transform.name)
    assert.equal(screened.ruleR19Penalty, 0, transform.name)
    const noWall = scoreTwoBishopsWhiteMove(fen,
      transformedMove(fen, transform, 'b2', 'a3'))
    assert.equal(noWall.ruleR19Applies, false, transform.name)
    assert.equal(noWall.ruleR19Penalty, 1, transform.name)
  }
})
