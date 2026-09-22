import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopFiveKingApproach, knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { getIdealKnightAndBishopWhiteMoves, knightAndBishopWhiteRules, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { compareScoresByRules } from './selection'

test('Kc5 is supported under the three-step limit and preferred on the approach to e7', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const counters of ['2 2', '72 42']) {
      const before = transformFen(`2k5/8/1K6/1B1N4/8/8/8/8 w - - ${counters}`, transform)
      const board = getChess(before)
      const move = board.move({from: transformSquare('b6', transform), to: transformSquare('c5', transform)}).san
      assert.deepEqual(knightAndBishopSupportedDiagonal(board.fen()), {size: 5, knight: 0})
      const score = scoreKnightAndBishopWhiteMove(before, move)
      assert.equal(score.supportedFiveApproachColorPenalty, 0)
      assert.equal(score.supportedFiveApproachDistance, 2)
      assert.deepEqual(getIdealKnightAndBishopWhiteMoves(before), [move])
    }
    for (const fen of [
      '3k4/8/8/1BKN4/8/8/8/8 b - - 1 1', // Other three-step placements now qualify without an exception.
    ]) assert.equal(knightAndBishopSupportedDiagonal(transformFen(fen, transform)).size, 5)
  }
})

test('five-knight approach uses opposite bishop color then king steps after bishop placement', () => {
  const rule = knightAndBishopWhiteRules.find(rule => rule.id === 'r2.5')!
  for (const transform of SQUARE_TRANSFORMS) {
    for (const black of ['c8', 'd8', 'c7'] as const) {
      const board = getChess('3k4/8/1K6/1B1N4/8/8/8/8 b - - 1 1')
      board.remove('d8'); board.put({type: 'k', color: 'b'}, black)
      // Geometry may qualify before other support tests; this helper only scores the approach.
      const score = knightAndBishopFiveKingApproach(transformFen(board.fen(), transform))
      assert.deepEqual(score, {color: 0, distance: 3})
    }
    const before = transformFen('2k5/8/1K6/1B1N4/8/8/8/8 w - - 2 2', transform)
    const move = getChess(before).move({from: transformSquare('b6', transform), to: transformSquare('c5', transform)}).san
    const score = scoreKnightAndBishopWhiteMove(before, move)
    assert.ok(compareScoresByRules({...score, supportedFiveApproachColorPenalty: 0, supportedFiveApproachDistance: 3},
      {...score, supportedFiveApproachColorPenalty: 1, supportedFiveApproachDistance: 1}, [rule]) < 0)
    assert.ok(compareScoresByRules({...score, supportedFiveApproachDistance: 2, supportedFiveBishopPenalty: 1},
      {...score, supportedFiveApproachDistance: 3, supportedFiveBishopPenalty: 0}, [rule]) > 0)
    assert.deepEqual(knightAndBishopFiveKingApproach(transformFen('k7/8/1K6/1B1N4/8/8/8/8 b - - 1 1', transform)), {color: 0, distance: 0})
  }
})
