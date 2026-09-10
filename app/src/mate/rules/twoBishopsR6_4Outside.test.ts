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
const chokeRule = twoBishopsWhiteRules.find(({ id }) => id === 'rule r6.4')!

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

test('r6.4 does not choke with White inside the wall, breaking the Bc6 and Ba4 loop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(loopFen, transform)
    const candidates = getChess(fen).moves().map((san) => ({
      san,
      score: scoreTwoBishopsWhiteMove(fen, san),
    }))
    for (const { san, score } of candidates) {
      assert.equal(score.ruleR6_4Applies, false, `${transform.name}: ${san}`)
      assert.equal(score.ruleR6_4Penalty, 0, `${transform.name}: ${san}`)
    }
    const chokeSelection = selectCandidatesByRules(candidates, [chokeRule])
    assert.equal(chokeSelection.eliminatedBy.size, 0, transform.name)
    assert.equal(chokeSelection.idealCandidates.length, candidates.length, transform.name)

    const chokeMove = transformedMove(fen, transform, 'a4', 'c6')
    const chosenMove = transformedMove(fen, transform, 'd8', 'a5')
    assert.notEqual(chosenMove, chokeMove)
    const chosen = candidates.find(({ san }) => san === chosenMove)!
    const choke = candidates.find(({ san }) => san === chokeMove)!
    // Ba5 creates tied outer walls a5–d8/a4–d1.
    const kingMove = transformedMove(fen, transform, 'e4', 'd4')
    const king = candidates.find(({ san }) => san === kingMove)!
    assert.equal(chosen.score.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(king.score.ruleR10OuterBishopPenalty, 0, transform.name)
    const selection = selectCandidatesByRules(candidates, twoBishopsWhiteRules)
    assert.equal(selection.eliminatedBy.get(king)?.id, 'rule r25', transform.name)
    assert.equal(selection.eliminatedBy.get(choke)?.id, 'rule r10', transform.name)
    assert.equal(chosen.score.ruleR24_5KingDistance, 13, transform.name)
    assert.equal(selection.lastEliminatingRule?.id, 'rule r30', transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [chosenMove], transform.name)
  }
})

test('r6.4 keeps the original Bf6 choke ahead of wall preferences', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(outsideFen, transform)
    // Kg7 is beyond e8-h5, opposite Black on the other side of d8-h4.
    const chokeMove = transformedMove(fen, transform, 'h4', 'f6')
    const retreatMove = transformedMove(fen, transform, 'e8', 'h5')
    const choke = scoreTwoBishopsWhiteMove(fen, chokeMove)
    const retreat = scoreTwoBishopsWhiteMove(fen, retreatMove)
    assert.equal(choke.ruleR6_4Applies, true, transform.name)
    assert.equal(retreat.ruleR6_4Applies, true, transform.name)
    assert.equal(choke.ruleR6_4Penalty, 0, transform.name)
    assert.equal(retreat.ruleR6_4Penalty, 1, transform.name)
    assert.ok(compareScoresByRules(choke, retreat, [chokeRule]) < 0, transform.name)
    assert.equal(choke.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.equal(retreat.ruleR10OuterBishopPenalty, 0, transform.name)
    assert.ok(compareScoresByRules(choke, retreat, twoBishopsWhiteRules) < 0, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [chokeMove], transform.name)

    // Eligibility belongs to the starting position even when a candidate
    // king move lands on the outer wall rather than staying outside.
    const wallMove = transformedMove(fen, transform, 'g7', 'g6')
    const onWall = scoreTwoBishopsWhiteMove(fen, wallMove)
    assert.equal(onWall.ruleR6_4Applies, true, transform.name)
    assert.equal(onWall.ruleR6_4Penalty, 1, transform.name)
  }
})

test('r6.4 stays inactive on either wall, including moves that take White outside', () => {
  for (const [starting, wall, from] of [
    [outerWallFen, 'outer e8-h5', 'g6'],
    [innerWallFen, 'inner d8-h4', 'g5'],
  ] as const) {
    for (const transform of SQUARE_TRANSFORMS) {
      const fen = transformFen(starting, transform)
      const label = `${transform.name}: ${wall}`
      for (const san of getChess(fen).moves()) {
        const score = scoreTwoBishopsWhiteMove(fen, san)
        assert.equal(score.ruleR6_4Applies, false, `${label}: ${san}`)
        assert.equal(score.ruleR6_4Penalty, 0, `${label}: ${san}`)
      }
      // Kh6 lands beyond both walls, but cannot qualify its starting turn.
      const exitMove = transformedMove(fen, transform, from, 'h6')
      assert.equal(scoreTwoBishopsWhiteMove(fen, exitMove).ruleR6_4Applies, false, label)
    }
  }
})

test('r6.4 becomes eligible on the next White turn after the king leaves the wall', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(outerWallFen, transform)
    const kingMove = transformedMove(fen, transform, 'g6', 'g7')
    assert.equal(scoreTwoBishopsWhiteMove(fen, kingMove).ruleR6_4Applies, false, transform.name)
    const chess = getChess(fen)
    chess.move(kingMove)
    chess.move(transformedMove(chess.fen(), transform, 'e6', 'e5'))
    const chokeMove = transformedMove(chess.fen(), transform, 'h4', 'f6')
    const choke = scoreTwoBishopsWhiteMove(chess.fen(), chokeMove)
    assert.equal(choke.ruleR6_4Applies, true, transform.name)
    assert.equal(choke.ruleR6_4Penalty, 0, transform.name)
  }
})
