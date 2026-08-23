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
import { evaluateRuleAADiagonalEscape } from './twoBishopsDiagonalEscape'

const RULE_AA_FEN = '8/8/8/8/7B/7K/8/3B2k1 w - - 0 1'

test('rule aa uniquely establishes the a6-f1 diagonal with Be2', () => {
  assert.deepEqual(getIdealTwoBishopsWhiteMoves(RULE_AA_FEN), ['Be2'])
  const score = scoreTwoBishopsWhiteMove(RULE_AA_FEN, 'Be2')
  assert.equal(score.ruleAAApplies, true)
  assert.equal(score.ruleAAPenalty, 0)
  assert.ok(scoreTwoBishopsWhiteMove(RULE_AA_FEN, 'Bc2').ruleAAPenalty > 0)
})

test('rule aa supports every rotation and reflection', () => {
  const move = getChess(RULE_AA_FEN).move('Be2')
  assert.ok(move)

  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(RULE_AA_FEN, transform)
    const expectedFrom = transformSquare(move.from, transform)
    const expectedTo = transformSquare(move.to, transform)
    assert.ok(
      getIdealTwoBishopsWhiteMoves(fen).some((san) => {
        const transformedMove = getChess(fen).move(san)
        return (
          transformedMove.from === expectedFrom &&
          transformedMove.to === expectedTo
        )
      }),
      transform.name,
    )
  }
})

test('rule aa rejects incomplete or already-completed geometry', () => {
  for (const fen of [
    '8/8/8/8/7B/7K/8/3B1k2 w - - 0 1',
    '8/8/8/8/7B/6K1/8/3B2k1 w - - 0 1',
    '8/8/8/7B/8/7K/8/3B2k1 w - - 0 1',
    '8/8/8/8/7B/7K/4B3/6k1 w - - 0 1',
  ]) {
    assert.equal(evaluateRuleAADiagonalEscape(fen).applies, false)
  }
})

test('rule aa stops after the target diagonal is established', () => {
  const result = getChess(RULE_AA_FEN)
  result.move('Be2')
  assert.equal(evaluateRuleAADiagonalEscape(result.fen()).applies, false)
})
