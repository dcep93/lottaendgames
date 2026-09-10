import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { analyzeTwoBishopsWhiteSelection, scoreTwoBishopsWhiteMove } from './twoBishops'

test('r6 rejects the new outer screen after Bh4 across all symmetries', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('2B5/8/4K2k/8/8/6B1/8/8 w - - 30 16', transform)
    const move = getChess(fen).moves({ verbose: true }).find(move =>
      move.from === transformSquare('g3', transform) && move.to === transformSquare('h4', transform))!
    assert.ok(move)
    const score = scoreTwoBishopsWhiteMove(fen, move.san)
    assert.equal(score.ruleR6DiagonalPenalty, 1, transform.name)
    assert.equal(score.ruleR10DiagonalCount, 4, transform.name)
    const selection = analyzeTwoBishopsWhiteSelection(fen)
    assert.ok(!selection.idealWhiteMoves.includes(move.san), transform.name)
    assert.equal(selection.ruleFilterCounts['rule r6'], 0, transform.name)
    assert.ok(selection.ruleFilterCounts['rule r7'] > 0, transform.name)
  }
})

test('clearing the outer screen restores r6 diagonal credit', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('2B5/8/7k/4K3/7B/8/8/8 w - - 0 1', transform)
    const moves = getChess(fen).moves({ verbose: true })
    for (const [to, penalty] of [['e6', 1], ['f5', 1], ['d5', 0]] as const) {
      const move = moves.find(move => move.from === transformSquare('e5', transform) &&
        move.to === transformSquare(to, transform))!
      assert.ok(move)
      assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).ruleR6DiagonalPenalty,
        penalty, `${transform.name}: ${to}`)
    }
  }
})

test('r6 ignores Kd2 behind Be3 when Black is closer to that bishop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/8/3KB2k/4B3/8 w - - 2 2', transform)
    const move = getChess(fen).moves({ verbose: true }).find(move =>
      move.from === transformSquare('d3', transform) && move.to === transformSquare('d2', transform))!
    assert.ok(move)
    assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).ruleR6DiagonalPenalty, 0, transform.name)
    const result = getChess(fen)
    result.move(move.san)
    // Kd2 physically blocks Be3-c1, but Black h3 is nearer Be3 than Kd2.
    assert.equal(result.isAttacked(transformSquare('c1', transform), 'w'), true)
    assert.deepEqual(analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves, [move.san], transform.name)
  }
})

test('equal Black distances to the screened bishop and White king qualify for the exception', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/6B1/8/8/5K1k/3B4/8 w - - 0 1', transform)
    const move = getChess(fen).moves({ verbose: true }).find(move =>
      move.from === transformSquare('g6', transform) && move.to === transformSquare('h5', transform))!
    // Black h3 is two squares from both Bh5 and Kf3.
    assert.ok(move)
    assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).ruleR6DiagonalPenalty, 0, transform.name)
  }
})

test('Be2+ wins r6 with Black equidistant from Be3 and Kd2', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/8/8/8/4B3/3K4/3B1k2 w - - 2 2', transform)
    const move = getChess(fen).moves({ verbose: true }).find(move =>
      move.from === transformSquare('d1', transform) && move.to === transformSquare('e2', transform))!
    assert.ok(move)
    assert.equal(scoreTwoBishopsWhiteMove(fen, move.san).ruleR6DiagonalPenalty, 0, transform.name)
    assert.deepEqual(analyzeTwoBishopsWhiteSelection(fen).idealWhiteMoves, [move.san], transform.name)
  }
})
