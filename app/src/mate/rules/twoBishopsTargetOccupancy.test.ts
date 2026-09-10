import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {getIdealTwoBishopsWhiteMoves, scoreTwoBishopsWhiteMove} from './twoBishops'

const starting = '1k6/8/B7/8/1K6/8/8/6B1 w - - 34 18'

test('Ka5 cannot approach occupied a6, and moving the bishop restores that target', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const move = (from: 'b4' | 'a6', to: 'a5' | 'b5' | 'f1') => getChess(fen).moves({verbose: true}).find(m =>
      m.from === transformSquare(from, transform) && m.to === transformSquare(to, transform))!.san
    for (const san of [move('b4', 'a5'), move('b4', 'b5')]) {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      assert.deepEqual(score.ruleR10TargetSquares, [], `${transform.name}: ${san}`)
      assert.equal(score.ruleR10KingDistance, 99)
      assert.equal(score.ruleR10DiagonalCount, 8, 'occupancy does not invalidate the wall')
    }
    for (const san of [move('a6', 'b5'), move('a6', 'f1')]) {
      const score = scoreTwoBishopsWhiteMove(fen, san)
      assert.deepEqual(score.ruleR10TargetSquares, [transformSquare('a6', transform)])
      assert.equal(score.ruleR10KingDistance, 2)
    }
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [move('a6', 'f1')], transform.name)
  }
})

test('an occupied tied candidate does not remove its unoccupied peer or a king-occupied target', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('3k4/8/5K2/8/8/B7/B7/8 w - - 56 29', transform)
    const moves = getChess(fen).moves({verbose: true})
    const bishopMove = moves.find(m => m.from === transformSquare('a2', transform) && m.to === transformSquare('e6', transform))!
    const bishop = scoreTwoBishopsWhiteMove(fen, bishopMove.san)
    assert.deepEqual(bishop.ruleR10TargetSquares, [transformSquare('f7', transform)])
    assert.equal(bishop.ruleR10KingDistance, 1)
    const kingMove = moves.find(m => m.from === transformSquare('f6', transform) && m.to === transformSquare('f7', transform))!
    const king = scoreTwoBishopsWhiteMove(fen, kingMove.san)
    assert.deepEqual([...king.ruleR10TargetSquares].sort(), ['e6','f7'].map(s => transformSquare(s as 'e6'|'f7', transform)).sort())
    assert.equal(king.ruleR10KingDistance, 1)
  }
})
