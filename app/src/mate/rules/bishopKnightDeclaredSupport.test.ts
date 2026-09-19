import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { knightAndBishopSupportedDiagonal } from './bishopKnightDiagonalSupport'
import { isRecordedSupportedCornerPosition, isRecordedSupportedFiveKingDefense, recordedCornerKnightTarget } from './bishopKnightDeclaredSupport'

test('declared three-diagonal support survives the preference cull, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '1kB5/8/1K1N4/8/8/8/8/8 b - - 42 23',
      '1k6/1N6/BK6/8/8/8/8/8 b - - 42 23',
      '2k5/1N6/B1K5/8/8/8/8/8 b - - 42 23',
      '1k6/8/B1K5/N7/8/8/8/8 b - - 42 23',
    ]) {
      const reflected = transformFen(fen, transform)
      assert.equal(isRecordedSupportedCornerPosition(reflected), true)
      assert.equal(isRecordedSupportedCornerPosition(reflected.replace(' b ', ' w ')), false)
      assert.equal(knightAndBishopSupportedDiagonal(reflected).size, 3)
    }
    assert.equal(isRecordedSupportedCornerPosition(transformFen('1k6/1N6/B1K5/8/8/8/8/8 b - - 0 1', transform)), false)
    assert.equal(knightAndBishopSupportedDiagonal(transformFen('1kB5/8/3N4/1K6/8/8/8/8 b - - 0 1', transform)).size, 99)
  }
})

test('the recorded Nb7-a5 support target remains c6 without preferring the move', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fen of [
      '1k6/1N6/B1K5/8/8/8/8/8 w - - 0 1',
      '1k6/8/B1K5/N7/8/8/8/8 b - - 0 1',
    ]) assert.equal(recordedCornerKnightTarget(transformFen(fen, transform)), transformSquare('c6', transform))
    assert.equal(recordedCornerKnightTarget(transformFen('k7/1N6/B1K5/8/8/8/8/8 w - - 0 1', transform)), undefined)
  }
})

test('declared Kd5 Bc6 versus Kc7 support retains the occupied knight-target exception', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const knight of ['b4', 'b6', 'c3', 'e3', 'e7', 'f4', 'f6', 'd3'] as const) {
      const board = getChess('8/2k5/2B5/3K4/8/8/8/8 b - - 42 23')
      board.put({color: 'w', type: 'n'}, knight)
      const reflected = transformFen(board.fen(), transform)
      assert.equal(isRecordedSupportedFiveKingDefense(reflected), knight !== 'd3')
      assert.equal(isRecordedSupportedFiveKingDefense(reflected.replace(' b ', ' w ')), false)
      if (knight !== 'd3') assert.equal(knightAndBishopSupportedDiagonal(reflected).size, 5)
    }
    for (const fen of [
      '8/2k5/2BK4/8/8/2N5/8/8 b - - 0 1',
      '8/1k6/2B5/3K4/8/2N5/8/8 b - - 0 1',
      '8/2k5/8/1B1K4/8/2N5/8/8 b - - 0 1',
    ]) assert.equal(isRecordedSupportedFiveKingDefense(transformFen(fen, transform)), false)
  }
})
