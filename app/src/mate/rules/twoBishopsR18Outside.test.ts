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
import { compareScoresByRules, selectCandidatesByRules } from './selection'
import {
  getIdealTwoBishopsWhiteMoves,
  scoreTwoBishopsWhiteMove,
  twoBishopsWhiteRules,
} from './twoBishops'

const loopFen = '3B4/8/4k3/8/B3K3/8/8/8 w - - 0 1'
const outsideFen = '4B3/6K1/4k3/8/7B/8/8/8 w - - 0 1'
const outerWallFen = '4B3/8/4k1K1/8/7B/8/8/8 w - - 0 1'
const innerWallFen = '4B3/8/4k3/6K1/7B/8/8/8 w - - 0 1'
const r18 = twoBishopsWhiteRules.find(({ id }) => id === 'rule r18')!

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

test('r18 does not choke with White inside the wall, breaking the Bc6 and Ba4 loop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loopFen, transform)
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    for (const { san, score } of candidates) {
      assert.equal(score.ruleR18Applies, false, `${transform.name}: ${san}`)
      assert.equal(score.ruleR18Penalty, 0, `${transform.name}: ${san}`)
    }
    const r18Selection = selectCandidatesByRules(candidates, [r18])
    assert.equal(r18Selection.eliminatedBy.size, 0, transform.name)
    assert.equal(r18Selection.idealCandidates.length, candidates.length, transform.name)

    const chokeMove = transformedMove(fen, transform, 'a4', 'c6')
    const chosenMove = transformedMove(fen, transform, 'd8', 'a5')
    assert.notEqual(chosenMove, chokeMove)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [chosenMove], transform.name)
  }
})

test('r18 keeps the original Bf6 choke when White starts strictly outside the wall', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(outsideFen, transform)
    // Kg7 is beyond e8-h5, opposite Black on the other side of d8-h4.
    const chokeMove = transformedMove(fen, transform, 'h4', 'f6')
    const retreatMove = transformedMove(fen, transform, 'e8', 'h5')
    const choke = scoreTwoBishopsWhiteMove(fen, chokeMove)
    const retreat = scoreTwoBishopsWhiteMove(fen, retreatMove)
    assert.equal(choke.ruleR18Applies, true, transform.name)
    assert.equal(retreat.ruleR18Applies, true, transform.name)
    assert.equal(choke.ruleR18Penalty, 0, transform.name)
    assert.equal(retreat.ruleR18Penalty, 1, transform.name)
    assert.ok(compareScoresByRules(choke, retreat, [r18]) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [chokeMove], transform.name)

    // Eligibility belongs to the starting position even when a candidate
    // king move lands on the outer wall rather than staying outside.
    const wallMove = transformedMove(fen, transform, 'g7', 'g6')
    const onWall = scoreTwoBishopsWhiteMove(fen, wallMove)
    assert.equal(onWall.ruleR18Applies, true, transform.name)
    assert.equal(onWall.ruleR18Penalty, 1, transform.name)
  }
})

test('r18 stays inactive on either wall, including moves that take White outside', () => {
  for (const [starting, wall, from] of [
    [outerWallFen, 'outer e8-h5', 'g6'],
    [innerWallFen, 'inner d8-h4', 'g5'],
  ] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(starting, transform)
      const label = `${transform.name}: ${wall}`
      for (const san of getChess(fen).moves()) {
        const score = scoreTwoBishopsWhiteMove(fen, san)
        assert.equal(score.ruleR18Applies, false, `${label}: ${san}`)
        assert.equal(score.ruleR18Penalty, 0, `${label}: ${san}`)
      }
      // Kh6 lands beyond both walls, but cannot qualify its starting turn.
      const exitMove = transformedMove(fen, transform, from, 'h6')
      assert.equal(scoreTwoBishopsWhiteMove(fen, exitMove).ruleR18Applies, false, label)
    }
  }
})

test('r18 becomes eligible on the next White turn after the king leaves the wall', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(outerWallFen, transform)
    const kingMove = transformedMove(fen, transform, 'g6', 'g7')
    assert.equal(scoreTwoBishopsWhiteMove(fen, kingMove).ruleR18Applies, false, transform.name)
    const chess = getChess(fen)
    chess.move(kingMove)
    chess.move(transformedMove(chess.fen(), transform, 'e6', 'e5'))
    const chokeMove = transformedMove(chess.fen(), transform, 'h4', 'f6')
    const choke = scoreTwoBishopsWhiteMove(chess.fen(), chokeMove)
    assert.equal(choke.ruleR18Applies, true, transform.name)
    assert.equal(choke.ruleR18Penalty, 0, transform.name)
  }
})
