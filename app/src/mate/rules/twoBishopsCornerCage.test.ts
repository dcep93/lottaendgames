import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARE_TRANSFORMS,
  getChess,
  transformFen,
  transformSquare,
} from '../chess'
import {
  getIdealTwoBishopsWhiteMoves,
  scoreTwoBishopsWhiteMove,
} from './twoBishops'
import {
  evaluateRuleACornerCage,
  getForcedMateInTwoMoves,
} from './twoBishopsCornerCage'

test('rule a first places White king a knight move from the corner', () => {
  const fen = '8/8/8/8/8/4K3/7k/3BB3 w - - 0 1'
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Kf2'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf2').ruleAApplies, true)
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Kf2').ruleAPenalty, 0)
})

test('rule a then places a bishop on the corner cage diagonal', () => {
  const fen = '8/8/8/8/8/8/5K1k/3BB3 w - - 0 1'
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg4'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg4').ruleAPenalty, 0)
  assert.ok(scoreTwoBishopsWhiteMove(fen, 'Bc2').ruleAPenalty > 0)
})

test('rule a selects the forced mate-in-two first move', () => {
  const fen = '8/8/8/8/6BB/8/5K1k/8 w - - 0 1'
  assert.deepEqual(getForcedMateInTwoMoves(fen), ['Bg3+'])
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), ['Bg3+'])
  assert.equal(scoreTwoBishopsWhiteMove(fen, 'Bg3+').ruleAPenalty, 0)
})

test('rule a otherwise keeps bishop waiting moves on the completed cage', () => {
  const fen = '8/8/8/8/6B1/8/5K1k/4B3 w - - 0 1'
  const evaluation = evaluateRuleACornerCage(fen)
  assert.equal(evaluation.applies, true)
  assert.equal(evaluation.penaltiesBySan.get('Bf5'), 1)
  assert.ok((evaluation.penaltiesBySan.get('Ke3') ?? 0) > 1)
})

test('rule a supports every rotation and reflection', () => {
  const fen = '8/8/8/8/8/8/5K1k/3BB3 w - - 0 1'
  const move = getChess(fen).move('Bg4')
  assert.ok(move)

  for (const transform of SQUARE_TRANSFORMS) {
    const transformedFen = transformFen(fen, transform)
    const expectedFrom = transformSquare(move.from, transform)
    const expectedTo = transformSquare(move.to, transform)
    const idealMoves = getIdealTwoBishopsWhiteMoves(transformedFen)
    assert.ok(
      idealMoves.some((san) => {
        const transformedMove = getChess(transformedFen).move(san)
        return (
          transformedMove.from === expectedFrom &&
          transformedMove.to === expectedTo
        )
      }),
      transform.name,
    )
  }
})

test('rule a is inactive beyond the two corner-edge squares', () => {
  const fen = '8/8/8/8/8/7k/5K2/3BB3 w - - 0 1'
  assert.equal(evaluateRuleACornerCage(fen).applies, false)
})
