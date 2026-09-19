import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove } from './bishopKnight'
import { getMateRuleSet } from './index'
import { knightAndBishopKnightTargetSquares } from './bishopKnightStrategy'

test('precage targets stay behind Be4 against Ke5 and Kd6, in every reflection', () => {
  const line = getChess('8/8/8/4k3/4B3/4K3/4N3/8 w - - 0 1')
  const positions = [line.fen()]
  line.move('Nd4')
  line.move('Kd6')
  positions.push(line.fen())
  for (const position of positions) for (const transform of SQUARE_TRANSFORMS) {
    assert.deepEqual(knightAndBishopKnightTargetSquares(transformFen(position, transform)), [transformSquare('d3', transform)])
  }
})

test('a perpendicular diagonal neighbor is not strictly behind the bishop', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/7k/8/3KB3/8/2N5/8/8 w - - 0 1', transform)
    // Be5's d6/f4 candidates are perpendicular to the e5–h8 direction.
    const board = getChess(fen)
    board.remove(transformSquare('h7', transform))
    board.put({type: 'k', color: 'b'}, transformSquare('h8', transform))
    assert.deepEqual(knightAndBishopKnightTargetSquares(board.fen()), [])
  }
})

test('r9 approaches Black with a precage knight in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1', transform)
    const move = getChess(fen).move({from: transformSquare('d4', transform), to: transformSquare('e5', transform)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move).precageKingProximityScore, 8)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move])
    assert.equal(getMateRuleSet('bishop-knight').currentWhiteHint(fen)?.id, 'r9')
  }
})

test('r9 evaluates knight placement after White moves', () => {
  const onTarget = '8/6k1/8/8/3KB3/3N4/8/8 w - - 0 1'
  const leaving = scoreKnightAndBishopWhiteMove(onTarget, 'Bd5')
  assert.equal(leaving.precageKnightPlacementPenalty, 1)
  assert.equal(leaving.precageKingProximityScore, 0)
  const offTarget = '8/6k1/8/3B4/3K4/3N4/8/8 w - - 0 1'
  const entering = scoreKnightAndBishopWhiteMove(offTarget, 'Be4')
  assert.equal(entering.precageKnightPlacementPenalty, 0)
  assert.equal(entering.precageKingProximityScore, 18)
})

test('r9 king preferences are inactive without a resulting precage knight', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/N1K5/B3k3/8/8/8/8/8 w - - 0 1', transform)
    for (const to of ['c6', 'c8'] as const) {
      const san = getChess(fen).move({from: transformSquare('c7', transform), to: transformSquare(to, transform)}).san
      const score = scoreKnightAndBishopWhiteMove(fen, san)
      assert.equal(score.precageKnightPlacementPenalty, 1)
      assert.equal(score.precageKingEdgePenalty, 0)
      assert.equal(score.precageKingProximityScore, 0)
      assert.equal(score.precageKingNonTargetCornerScore, 0)
    }
  }
})

test('r9 breaks equal king proximity by the closest non-target corner in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/4k3/8/4B1K1/3N4/8/8 w - - 0 1', transform)
    const san = (to: 'g5' | 'f4') => getChess(fen).move({from: transformSquare('g4', transform), to: transformSquare(to, transform)}).san
    const towardCorner = scoreKnightAndBishopWhiteMove(fen, san('g5'))
    const towardCenter = scoreKnightAndBishopWhiteMove(fen, san('f4'))
    for (const score of [towardCorner, towardCenter]) {
      assert.equal(score.precageKnightPlacementPenalty, 0)
      assert.equal(score.precageKingEdgePenalty, 0)
      assert.equal(score.precageKingProximityScore, 5)
    }
    assert.equal(towardCorner.precageKingNonTargetCornerScore, 10)
    assert.equal(towardCenter.precageKingNonTargetCornerScore, 20)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('g5')])
  }
})

test('r9 keeps the knight on d3 in the loaded position, including reflections', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('8/8/5k2/2K5/4B3/3N4/8/8 w - - 0 1', transform)
    const move = (from: 'c5' | 'd3', to: 'd5' | 'b2') => getChess(fen).move({from: transformSquare(from, transform), to: transformSquare(to, transform)}).san
    const staying = scoreKnightAndBishopWhiteMove(fen, move('c5', 'd5'))
    assert.equal(staying.precageKnightPlacementPenalty, 0)
    assert.equal(scoreKnightAndBishopWhiteMove(fen, move('d3', 'b2')).precageKnightPlacementPenalty, 1)
    for (const san of getIdealKnightAndBishopWhiteMoves(fen)) {
      assert.equal(scoreKnightAndBishopWhiteMove(fen, san).precageKnightPlacementPenalty, 0)
    }
  }
})

test('r9 prefers leaving the edge over being closer to Black, in every reflection', () => {
  for (const transform of SQUARE_TRANSFORMS) {
    const fen = transformFen('5k2/3K4/8/8/4B3/3N4/8/8 w - - 0 1', transform)
    const san = (to: 'e6' | 'd8') => getChess(fen).move({from: transformSquare('d7', transform), to: transformSquare(to, transform)}).san
    const interior = scoreKnightAndBishopWhiteMove(fen, san('e6'))
    const edge = scoreKnightAndBishopWhiteMove(fen, san('d8'))
    assert.equal(interior.precageKingEdgePenalty, 0)
    assert.equal(edge.precageKingEdgePenalty, 1)
    assert.ok(interior.precageKingProximityScore > edge.precageKingProximityScore)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('e6')])
  }
})
