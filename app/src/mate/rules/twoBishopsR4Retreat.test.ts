import assert from 'node:assert/strict'
import test from 'node:test'
import { SQUARE_TRANSFORMS, getChess, transformFen, transformSquare } from '../chess'
import {
  getIdealTwoBishopsWhiteMoves,
  isTwoBishopsPhaseTwoPosition,
  scoreTwoBishopsWhiteMove,
} from './twoBishops'

const retreatFen = '4Bk1B/8/5K2/8/8/8/8/8 w - - 0 1'
const retreatTargets = ['d7', 'c6', 'b5', 'a4'] as const

test('r4 allows exactly the four e8-a4 bishop retreats in all eight orientations', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(retreatFen, transform)
    const moves = getChess(fen).moves({ verbose: true })
    const expected = moves.filter((move) => move.from === transformSquare('e8', transform)
      && retreatTargets.some((square) => move.to === transformSquare(square, transform)))
      .map((move) => move.san).sort()
    assert.equal(expected.length, 4, transform.name)
    const accepted = moves.filter((move) => {
      const score = scoreTwoBishopsWhiteMove(fen, move.san)
      assert.equal(score.ruleR4Applies, true, `${transform.name} ${move.san}`)
      return score.ruleR4Penalty === 0
    }).map((move) => move.san).sort()
    assert.deepEqual(accepted, expected, transform.name)
    assert.equal(isTwoBishopsPhaseTwoPosition(fen), true, transform.name)
    const ideals = getIdealTwoBishopsWhiteMoves(fen)
    assert.ok(ideals.length > 0, transform.name)
    assert.ok(ideals.every((san) => expected.includes(san)), transform.name)
  }
})

test('every accepted retreat forces the Black king toward the corner without stalemate', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(retreatFen, transform)
    for (const target of retreatTargets) {
      const chess = getChess(fen)
      const move = chess.moves({ verbose: true }).find((candidate) =>
        candidate.from === transformSquare('e8', transform)
        && candidate.to === transformSquare(target, transform))!
      chess.move(move.san)
      assert.equal(chess.isGameOver(), false, `${transform.name} ${target}`)
      assert.deepEqual(chess.moves({ verbose: true }).map((reply) => reply.to),
        [transformSquare('g8', transform)], `${transform.name} ${target}`)
    }
  }
})

test('the exact retreat requires both kings and the fixed corner bishop in place', () => {
  const changedPositions = [
    '4Bk1B/8/4K3/8/8/8/8/8 w - - 0 1',
    '3kB2B/8/5K2/8/8/8/8/8 w - - 0 1',
    '4Bk2/8/5K2/8/8/8/8/B7 w - - 0 1',
  ]
  for (const fen of changedPositions) {
    const score = scoreTwoBishopsWhiteMove(fen, 'Ba4')
    assert.equal(score.ruleR4Applies, false, fen)
  }
})
