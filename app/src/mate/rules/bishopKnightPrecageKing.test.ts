import assert from 'node:assert/strict'
import test from 'node:test'
import { getChess, SQUARE_TRANSFORMS, transformFen, transformSquare } from '../chess'
import { getIdealKnightAndBishopWhiteMoves, scoreKnightAndBishopWhiteMove, knightAndBishopWhiteRules } from './bishopKnight'

const position = '8/6k1/8/3B4/2N5/2K5/8/8 w - - 0 1'
test('r5.1 approaches Black instead of the edge across D4', () => {
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(position, t)
    const chess = getChess(fen)
    const san = chess.move({from: transformSquare('c3',t), to: transformSquare('d4',t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [san])
    assert.equal(scoreKnightAndBishopWhiteMove(fen, san).precageKingSteps, 3)
  }
  const rule = knightAndBishopWhiteRules.find(r => r.id === 'r5.1')!
  assert.ok(rule.compare!(scoreKnightAndBishopWhiteMove(position,'Kd4'), scoreKnightAndBishopWhiteMove(position,'Kb4')) < 0)
})
test('r5.1 activates before White moves and does not reward disabling its condition', () => {
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Be6').precageKingSteps, 4)
  assert.equal(scoreKnightAndBishopWhiteMove(position,'Ne3').precageKingSteps, 4)
  for (const [fen,move] of [
    ['8/6k1/3B4/8/2N5/2K5/8/8 w - - 0 1','Kd4'],
    ['8/6k1/8/3B4/8/2K1N3/8/8 w - - 0 1','Kd4'],
  ]) assert.equal(scoreKnightAndBishopWhiteMove(fen!,move!).precageKingSteps,0)
})


test('r5.1 prefers king step proximity in the loaded position across D4', () => {
  const start = '8/2k5/8/3BK3/2N5/8/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen(start,t)
    const san = getChess(fen).move({from:transformSquare('e5',t),to:transformSquare('e6',t)}).san
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen),[san])
    assert.equal(scoreKnightAndBishopWhiteMove(fen,san).precageKingSteps,2)
  }
})


test('r5.1 activates for Nd3 with Bd5 even without bishop adjacency, across D4', () => {
  const start='8/4k3/8/3BK3/8/3N4/8/8 w - - 0 1'
  for (const t of SQUARE_TRANSFORMS) {
    const fen=transformFen(start,t)
    const san=getChess(fen).move({from:transformSquare('e5',t),to:transformSquare('f5',t)}).san
    assert.equal(scoreKnightAndBishopWhiteMove(fen,san).precageKingSteps,2)
  }
})

test('r5.1 ties equal king-step distances so r6 can choose Ke5 across D4', () => {
  const rule = knightAndBishopWhiteRules.find(r => r.id === 'r5.1')!
  for (const t of SQUARE_TRANSFORMS) {
    const fen = transformFen('1k6/8/8/3B4/2NK4/8/8/8 w - - 0 1', t)
    const move = (to: 'c5' | 'e5') => getChess(fen).move({from: transformSquare('d4', t), to: transformSquare(to, t)}).san
    const nearerEuclidean = scoreKnightAndBishopWhiteMove(fen, move('c5'))
    const fartherEuclidean = scoreKnightAndBishopWhiteMove(fen, move('e5'))
    assert.equal(nearerEuclidean.precageKingSteps, 3)
    assert.equal(fartherEuclidean.precageKingSteps, 3)
    assert.equal(rule.compare!(nearerEuclidean, fartherEuclidean), 0)
    assert.deepEqual(getIdealKnightAndBishopWhiteMoves(fen), [move('e5')])
  }
})
