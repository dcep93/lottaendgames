import assert from 'node:assert/strict'
import test from 'node:test'
import {getChess, SQUARE_TRANSFORMS, transformFen, transformSquare} from '../chess'
import {getIdealTwoBishopsWhiteMoves, scoreTwoBishopsWhiteMove, twoBishopsWhiteRules} from './twoBishops'
import {compareScoresByRules, firstDifferingRule} from './selection'

const starting = '8/8/8/K7/2k5/8/8/3BB3 w - - 10 6'

test('Be2+ counts the worst resulting side: nine toward h8 or four after Kb3', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const moves = getChess(fen).moves({verbose: true})
    const bishopMove = moves.find(m => m.from === transformSquare('d1', transform) && m.to === transformSquare('e2', transform))!
    const alternative = moves.find(m => m.from === transformSquare('e1', transform) && m.to === transformSquare('d2', transform))!
    const bishop = scoreTwoBishopsWhiteMove(fen, bishopMove.san)
    const other = scoreTwoBishopsWhiteMove(fen, alternative.san)
    const result = getChess(fen)
    result.move(bishopMove.san)
    assert.deepEqual(result.moves({verbose: true}).map(m => m.to).sort(),
      ['c5','d5','d4','b3'].map(s => transformSquare(s as 'c5'|'d5'|'d4'|'b3', transform)).sort())
    assert.equal(bishop.ruleR10DiagonalCount, 9, transform.name)
    assert.equal(other.ruleR10DiagonalCount, 9, transform.name)
    assert.equal(compareScoresByRules(bishop, other, twoBishopsWhiteRules.filter(r => r.id === 'rule r8')), 0)
    assert.equal(firstDifferingRule(bishop, other, twoBishopsWhiteRules)?.id, 'rule r10')
    assert.equal(bishop.ruleR10KingDistance, 1)
    assert.equal(other.ruleR10KingDistance, 4)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [bishopMove.san], transform.name)
  }
})

test('crossing into the larger area invalidates the wall', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/K7/8/2k5/4BB2/8 w - - 0 1', transform)
    const move = getChess(fen).moves({verbose: true}).find(m =>
      m.from === transformSquare('f2', transform) && m.to === transformSquare('e1', transform))!
    const result = getChess(fen)
    result.move(move.san)
    assert.ok(result.moves({verbose: true}).some(m => m.to === transformSquare('d4', transform)))
    assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).ruleR10DiagonalCount, 10, transform.name)
  }
})


test('Bb8+ is rejected by r8 because Kd4 escapes from six diagonals into seven', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/B7/2K5/4k3/8/8/6B1/8 w - - 0 1', transform)
    const moves = getChess(fen).moves({verbose: true})
    const move = moves.find(m => m.from === transformSquare('a7', transform) && m.to === transformSquare('b8', transform))!
    const alternative = moves.find(m => m.from === transformSquare('a7', transform) && m.to === transformSquare('b6', transform))!
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    const other = scoreTwoBishopsWhiteMove(fen, alternative.san)
    assert.equal(score.ruleR10DiagonalCount, 99, transform.name)
    assert.equal(other.ruleR10DiagonalCount, 7, transform.name)
    assert.ok(compareScoresByRules(score, other, twoBishopsWhiteRules.filter(r => r.id === 'rule r8')) > 0, transform.name)
    assert.ok(!getIdealTwoBishopsWhiteMoves(fen).includes(move.san), transform.name)
  }
})
