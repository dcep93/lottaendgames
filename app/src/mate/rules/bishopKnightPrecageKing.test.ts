import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove, knightAndBishopWhiteRules } from './bishopKnight'

const position = '8/6k1/8/3B4/2N5/2K5/8/8 w - - 0 1'
test('r5.1 approaches the parallel diagonal across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, t)
    const chess = getChess(fen)
    const san = chess.move({from: transformSquare('c3',t), to: transformSquare('d4',t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).precageKingDistanceSquared, 18)
  }
  const rule = knightAndBishopWhiteRules.find(r => r.id === 'r5.1')!
  assert.ok(rule.compare!(scoreKnightAndBishopWhiteMove(position,'Kd4'), scoreKnightAndBishopWhiteMove(position,'Kb4')) < 0)
})
test('r5.1 activates before White moves and does not reward disabling its condition', () => {
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Be6').precageKingDistanceSquared, 32)
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Be6').precageKingDiagonalSteps, 5)
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Ne3').precageKingDiagonalSteps, 5)
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Ne3').precageKingDistanceSquared, 32)
  for (const [fen,move] of [
    ['8/6k1/3B4/8/2N5/2K5/8/8 w - - 0 1','Kd4'],
    ['8/6k1/8/3B4/8/2KN4/8/8 w - - 0 1','Kd4'],
  ]) {
    assert.equal(scoreKnightAndBishopWhiteMove(fen!,move!).precageKingDistanceSquared,0)
    assert.equal(scoreKnightAndBishopWhiteMove(fen!,move!).precageKingDiagonalSteps,0)
  }
})


test('r5.1 skips the opposite-color diagonal through Black across D4', () => {
  const start = '8/2k5/8/3BK3/2N5/8/8/8 w - - 0 1'
  const rule = knightAndBishopWhiteRules.find(r => r.id === 'r5.1')!
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const san = (to: 'f4' | 'e6') => getChess(fen).move({from: transformSquare('e5',t), to: transformSquare(to,t)}).san
    const onDiagonal = scoreKnightAndBishopWhiteMove(fen, san('f4'))
    const closerKing = scoreKnightAndBishopWhiteMove(fen, san('e6'))
    assert.equal(onDiagonal.precageKingDiagonalSteps, 1)
    assert.equal(closerKing.precageKingDiagonalSteps, 1)
    assert.ok(onDiagonal.precageKingDistanceSquared > closerKing.precageKingDistanceSquared)
    assert.ok(rule.compare!(closerKing, onDiagonal) < 0)
    // Keeping Ke5 ties Kf4 in steps to the target and wins on direct distance to Black.
    const fartherSan = getChess(fen).move({from: transformSquare('c4',t), to: transformSquare('b6',t)}).san
    const unchangedKing = scoreKnightAndBishopWhiteMove(fen, fartherSan)
    assert.equal(unchangedKing.precageKingDiagonalSteps, 1)
    assert.ok(rule.compare!(unchangedKing, onDiagonal) < 0)
  }
})


test('r5.1 ties diagonal nearby diagonal offsets at two king steps, then approaches Black across D4', () => {
  const start = '8/8/8/3B4/1kN1K3/8/8/8 w - - 0 1'
  const rule = knightAndBishopWhiteRules.find(r => r.id === 'r5.1')!
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const san = (to: 'd4' | 'd3') => getChess(fen).move({from: transformSquare('e4',t), to: transformSquare(to,t)}).san
    const straight = scoreKnightAndBishopWhiteMove(fen, san('d4'))
    const diagonal = scoreKnightAndBishopWhiteMove(fen, san('d3'))
    assert.equal(straight.precageKingDiagonalSteps, 2)
    assert.equal(diagonal.precageKingDiagonalSteps, 2)
    assert.ok(rule.compare!(straight, diagonal) < 0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san('d4')])
  }
})


test('r5.1 prefers logged 2. Kf6 beyond the parallel diagonal across D4', () => {
  const line = getChess('8/2k5/8/3B1K2/2N5/8/8/8 w - - 0 1')
  line.move('Ke5')
  line.move('Kd7')
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), t)
    const san = getChess(fen).move({from: transformSquare('e5',t), to: transformSquare('f6',t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).precageKingDiagonalSteps, 0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
  }
})


test('r5.1 measures steps to board squares rather than an infinite diagonal across D4', () => {
  const start = 'K7/8/8/3B4/2N5/8/8/1k6 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const san = getChess(fen).move({from: transformSquare('a8',t), to: transformSquare('b8',t)}).san
    // Black b1 selects the opposite-color diagonal consisting of a1 alone.
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).precageKingDiagonalSteps, 7)
  }
})


test('r5.1 breaks the loaded shuffle with Kf6 across D4', () => {
  const line = getChess('2k5/8/8/3B4/2N2K2/8/8/8 w - - 0 1')
  line.move('Kg5')
  line.move('Kc7')
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(line.fen(), t)
    const san = getChess(fen).move({from: transformSquare('g5',t), to: transformSquare('f6',t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
  }
})

test('r5.1 has a neutral diagonal score when Black is beyond the last board diagonal', () => {
  const start = '8/7K/8/3B4/2N5/8/8/k7 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const san = getChess(fen).move({from: transformSquare('h7',t), to: transformSquare('g6',t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).precageKingDiagonalSteps, 0)
  }
})
