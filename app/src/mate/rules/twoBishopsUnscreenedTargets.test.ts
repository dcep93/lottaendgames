import assert from 'node:assert/strict'
import test from 'node:test'
import type { Square } from 'chess.js'
import {
  SQUARE_TRANSFORMS, getChess, kingDistance, transformFen, transformSquare,
  type SquareTransform,
} from '../chess'
import { getIdealTwoBishopsWhiteMoves, scoreTwoBishopsWhiteMove } from './twoBishops'

function moveFor(fen: string, transform: SquareTransform, from: Square, to: Square) {
  const move = getChess(fen).moves({ verbose: true }).find((candidate) =>
    candidate.from === transformSquare(from, transform) &&
    candidate.to === transformSquare(to, transform))
  assert.ok(move, `${transform.name}: ${from}-${to}`)
  return move.san
}

test('Kf5 has no target when the closest candidate is screened, without a farther fallback', () => {
  const starting = '8/8/6B1/8/6K1/8/8/2B1k3 w - - 14 8'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = moveFor(fen, transform, 'g4', 'f5')
    const score = scoreTwoBishopsWhiteMove(fen, san)
    const result = getChess(fen)
    result.move(san)
    const target = transformSquare('f5', transform)
    const black = transformSquare('e1', transform)
    assert.equal(kingDistance(black, transformSquare('d3', transform)), 2)
    assert.equal(kingDistance(black, target), 4)
    assert.equal(result.isAttacked(transformSquare('d3', transform), 'w'), false)
    // Even the king-controlled first square beyond the screen is excluded.
    assert.equal(result.isAttacked(transformSquare('e4', transform), 'w'), true)
    assert.equal(score.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual(score.ruleR10TargetSquares, [], transform.name)
    assert.equal(score.ruleR10TargetPenalty, 1, transform.name)
    assert.equal(score.ruleR10KingDistance, 99, transform.name)
    assert.equal(score.ruleR24_5KingDistance, 1, transform.name)
    const insideMove = moveFor(fen, transform, 'g4', 'f3')
    const inside = scoreTwoBishopsWhiteMove(fen, insideMove)
    assert.equal(inside.ruleR10DiagonalCount, 5, transform.name)
    assert.deepEqual([...inside.ruleR10TargetSquares].sort(),
      (['c2', 'd3'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.equal(inside.ruleR10KingDistance, 2, transform.name)
    assert.deepEqual(getIdealTwoBishopsWhiteMoves(fen), [insideMove], transform.name)
  }
})

test('a screened member of a closest-distance tie is excluded even when controlled', () => {
  const starting = '8/8/8/8/2K5/5k2/1B6/1B6 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = moveFor(fen, transform, 'c4', 'd4')
    const score = scoreTwoBishopsWhiteMove(fen, san)
    const result = getChess(fen)
    result.move(san)
    const black = transformSquare('f3', transform)
    for (const square of ['d4', 'e5'] as const) {
      assert.equal(kingDistance(black, transformSquare(square, transform)), 2)
    }
    assert.equal(result.isAttacked(transformSquare('e5', transform), 'w'), true)
    assert.equal(score.ruleR10DiagonalCount, 6, transform.name)
    assert.deepEqual(score.ruleR10TargetSquares, [transformSquare('d4', transform)], transform.name)
    assert.equal(score.ruleR10KingDistance, 1, transform.name)
  }
})

test('all equally closest squares remain targets when White is outside the wall', () => {
  const starting = '8/8/8/2K5/8/5k2/1B6/1B6 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const score = scoreTwoBishopsWhiteMove(fen, moveFor(fen, transform, 'c5', 'd5'))
    assert.equal(score.ruleR10DiagonalCount, 6, transform.name)
    assert.deepEqual([...score.ruleR10TargetSquares].sort(),
      (['d4', 'e5'] as const).map((square) => transformSquare(square, transform)).sort(), transform.name)
    assert.equal(score.ruleR10KingDistance, 1, transform.name)
  }
})

test('a bishop-occupied closest square is excluded without a farther fallback', () => {
  const starting = '8/8/8/8/8/K7/1B6/1Bk5 w - - 0 1'
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen(starting, transform)
    const san = moveFor(fen, transform, 'a3', 'a2')
    const score = scoreTwoBishopsWhiteMove(fen, san)
    const target = transformSquare('b2', transform)
    assert.equal(getChess(fen).get(target)?.type, 'b')
    assert.equal(score.ruleR10DiagonalCount, 6, transform.name)
    assert.deepEqual(score.ruleR10TargetSquares, [], transform.name)
    assert.equal(score.ruleR10KingDistance, 99, transform.name)
  }
})
