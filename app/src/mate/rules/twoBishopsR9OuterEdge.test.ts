import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {getIdealTwoBishopsWhiteMoves, scoreTwoBishopsWhiteMove} from './twoBishops'

const fixtures = [
  {fen: '8/8/2k5/2B5/3K4/8/B7/8 w - - 2 2', from: 'd4', to: 'c4', applies: false, penalty: 1},
  {fen: '8/8/2k5/2B5/3K4/8/B7/8 w - - 2 2', from: 'a2', to: 'g8', applies: false, penalty: 1},
  {fen: '8/8/2k5/2B5/3K4/8/B7/8 w - - 2 2', from: 'a2', to: 'b3', applies: true, penalty: 1},
  {fen: '8/8/2k5/2B5/3K4/1B6/8/8 w - - 0 1', from: 'd4', to: 'c4', applies: true, penalty: 0},
  {fen: '8/8/2k5/2B5/3K4/1B6/8/8 w - - 0 1', from: 'b3', to: 'a2', applies: false, penalty: 1},
  // The inner bishop may be on a target-corner edge; only the outer bishop is gated.
  {fen: '8/8/2k5/8/3K4/BB6/8/8 w - - 0 1', from: 'd4', to: 'c4', applies: true, penalty: 0},
] as const

test('r9 checks both target-corner edges and the resulting outer bishop across symmetries', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    for (const fixture of fixtures) {
      const fen = transformFen(fixture.fen, transform)
      const move = getChess(fen).moves({verbose: true}).find(move =>
        move.from === transformSquare(fixture.from, transform) && move.to === transformSquare(fixture.to, transform))!
      assert.ok(move, `${transform.name}: ${fixture.from}-${fixture.to}`)
      const score = scoreTwoBishopsWhiteMove(fen, move.san)
      assert.equal(score.ruleR9Applies, fixture.applies, `${transform.name}: ${move.san}`)
      assert.equal(score.ruleR9Penalty, fixture.penalty, `${transform.name}: ${move.san}`)
      assert.deepEqual(score.ruleR9TargetSquares, fixture.applies ? [transformSquare('c4', transform)] : [])
      assert.ok(score.ruleR10DiagonalCount < 99, 'the edge condition does not invalidate the wall')
    }
  }
})

test('Bb3 replaces Kc4 in the supplied loop when Ba2 exempts r9', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(fixtures[0].fen, transform)
    const move = getChess(fen).moves({verbose: true}).find(move =>
      move.from === transformSquare('a2', transform) && move.to === transformSquare('b3', transform))!
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [move.san], transform.name)
  }
})
