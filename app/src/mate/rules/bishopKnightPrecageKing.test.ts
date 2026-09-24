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
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Be6').precageKingDiagonalDistanceSquared, 32)
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Ne3').precageKingDiagonalDistanceSquared, 32)
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Ne3').precageKingDistanceSquared, 32)
  for (const [fen,move] of [
    ['8/6k1/3B4/8/2N5/2K5/8/8 w - - 0 1','Kd4'],
    ['8/6k1/8/3B4/8/2KN4/8/8 w - - 0 1','Kd4'],
  ]) {
    assert.equal(scoreKnightAndBishopWhiteMove(fen!,move!).precageKingDistanceSquared,0)
    assert.equal(scoreKnightAndBishopWhiteMove(fen!,move!).precageKingDiagonalDistanceSquared,0)
  }
})


test('r5.1 prioritizes the parallel diagonal before direct king proximity across D4', () => {
  const start = '8/2k5/8/3BK3/2N5/8/8/8 w - - 0 1'
  const rule = knightAndBishopWhiteRules.find(r => r.id === 'r5.1')!
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start, t)
    const san = (to: 'f4' | 'e6' ) => getChess(fen).move({from: transformSquare('e5',t), to: transformSquare(to,t)}).san
    const onDiagonal = scoreKnightAndBishopWhiteMove(fen, san('f4'))
    const closerKing = scoreKnightAndBishopWhiteMove(fen, san('e6'))
    assert.equal(onDiagonal.precageKingDiagonalDistanceSquared, 0)
    assert.equal(closerKing.precageKingDiagonalDistanceSquared, 0.5)
    assert.ok(onDiagonal.precageKingDistanceSquared > closerKing.precageKingDistanceSquared)
    assert.ok(rule.compare!(onDiagonal, closerKing) < 0)
    // Keeping Ke5 ties Kf4 on the diagonal and wins on direct distance to Black.
    const fartherSan = getChess(fen).move({from: transformSquare('c4',t), to: transformSquare('b6',t)}).san
    const unchangedKing = scoreKnightAndBishopWhiteMove(fen, fartherSan)
    assert.equal(unchangedKing.precageKingDiagonalDistanceSquared, 0)
    assert.ok(rule.compare!(unchangedKing, onDiagonal) < 0)
  }
})
